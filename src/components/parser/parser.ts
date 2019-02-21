import * as ts from 'typescript';
import { ParseSpecResult } from '../../entities/parse-spec-result/parse-spec-result';
import { tsquery } from '@phenomnomnominal/tsquery';
import { AstNodeType } from '../../enums/ast-node.enum';
import { SpecTreeNode } from '../../entities/spec-tree-node/spec-tree-node';
import { NodeType } from '../../enums/node.enum';
import { KeywordEnum } from '../../enums/keyword.enum';

export function parseSpec(data: ts.SourceFile): ParseSpecResult {
    const imports = parseImportStatements(data);
    const tree = buildTree(data);

    return new ParseSpecResult({ imports, tree });
}

function buildTree(data: ts.SourceFile): SpecTreeNode | undefined {
    const selector = `${AstNodeType.CALL_EXPRESSION} ${AstNodeType.IDENTIFIER}[text=${NodeType.DESCRIBE}]`;
    const documentationNode = tsquery.query<ts.Identifier>(data, selector)
        .map(node => node.parent as ts.CallExpression)
        .filter(node => node.arguments[0].getText().includes(`#documentation`))[0];

    if (!documentationNode) {
        console.log(`SKIPPED ${data.fileName}: dont found ${NodeType.DESCRIBE} with "#documentation" title`);
        return;
    }

    const middleNode = buildNode(documentationNode);
    middleNode.parent = searchParent(documentationNode, middleNode);
    middleNode.children = searchChildren(documentationNode, middleNode);

    return getRootTree(middleNode);
}

function searchChildren(node: ts.Node, parent: SpecTreeNode): SpecTreeNode[] {
    return getStatementsInsideNode(node).filter(statement => {
        return ts.isExpressionStatement(statement) && isSpecTreeNodeTyped(statement.expression);
    })
        .map(statement => (statement as ts.ExpressionStatement).expression as ts.CallExpression)
        .map(child => {
            const childSpecNode = buildNode(child);
            childSpecNode.parent = parent;
            childSpecNode.children = searchChildren(child, childSpecNode);
            return childSpecNode;
        });
}

function searchParent(node: ts.Node, child: SpecTreeNode): SpecTreeNode | undefined {
    const parent = node.parent;

    if (!Boolean(parent)) {
        return;
    }

    if (isSpecTreeNodeTyped(parent)) {
        const parentSpecNode = buildNode(parent as ts.CallExpression);
        parentSpecNode.parent = searchParent(parent, parentSpecNode);
        parentSpecNode.children = [child];
        return parentSpecNode;
    }

    return searchParent(parent, child);
}

function getRootTree(node: SpecTreeNode): SpecTreeNode {
    if (!Boolean(node.parent)) {
        return node;
    }

    return getRootTree(node.parent as SpecTreeNode);
}

function isSpecTreeNodeTyped(node: ts.Node): boolean {
    return ts.isCallExpression(node) && [`${NodeType.DESCRIBE}`, `${NodeType.IT}`].includes(node.expression.getText());
}

function buildNode(node: ts.CallExpression): SpecTreeNode {
    const type = node.expression.getText() as NodeType;
    // Take name spec and remove extra quotes
    const title = node.arguments[0].getText().replace(/'/g, '');

    // Collect required statements
    const statements = getStatementsInsideNode(node)
        .filter(statement => {
            return ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)
                || ts.isVariableStatement(statement)
                || ts.isFunctionDeclaration(statement);
        });

    const copyContainerStatement = [...statements];

    const reversedIndex = copyContainerStatement.reverse().findIndex(statement => {
        const isVariableStatement = ts.isVariableStatement(statement);
        const keywords = [KeywordEnum.COMPONENT.toString(), KeywordEnum.JSX.toString()];
        let hasDeclaration = false;
        if (isVariableStatement) {
            const declaration = (statement as ts.VariableStatement).declarationList.declarations[0];
            hasDeclaration = keywords.includes(declaration.name.getText());
        }

        const isBinaryExpression = ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression);
        let hasExpression = false;
        if (isBinaryExpression) {
            const expression = (statement as ts.ExpressionStatement).expression as ts.BinaryExpression;
            hasExpression = keywords.includes(expression.left.getText());
        }

        return hasDeclaration || hasExpression;
    });

    // TODO обработать BeforeEach

    const filteredStatements = reversedIndex !== -1
        ? copyContainerStatement.slice(reversedIndex).reverse() : copyContainerStatement.reverse();

    return new SpecTreeNode({ type, title, statements: filteredStatements });
}

function getStatementsInsideNode(node: ts.Node): ts.Statement[] {
    const selector = `${AstNodeType.CALL_EXPRESSION} Block`;
    const block = tsquery.query<ts.Block>(node, selector)[0];
    // Receive only collection statements, filter props 'pos', 'end'
    return block.statements.filter(statement => typeof statement === 'object');
}

// Create map structure from import statements
function parseImportStatements(data: ts.SourceFile): Map<string, string> {
    const imports = new Map<string, string>();

    tsquery.query<ts.ImportDeclaration>(data, AstNodeType.IMPORT_DECLARATION)
        .forEach(node => {
            const isNamedImports = Boolean(tsquery.query(node, AstNodeType.NAMED_IMPORTS).length);

            tsquery.query(node, `${AstNodeType.IMPORT_CLAUSE} ${AstNodeType.IDENTIFIER}`)
                .forEach(identifier => {
                    let importText = node.getText();
                    if (isNamedImports) {
                        importText = importText.replace(/{ (.*?) }/, `{ ${identifier.getText()} }`);
                    }

                    imports.set(identifier.getText(), importText);
                });
        });

    return imports;
}