import * as ts from 'typescript';
import { ParseSpecResult } from '../../entities/parse-spec-result/parse-spec-result';
import { tsquery } from '@phenomnomnominal/tsquery';
import { AstNodeType } from '../../enums/ast-node.enum';
import { SpecTreeNode } from '../../entities/spec-tree-node/spec-tree-node';
import { NodeType } from '../../enums/node.enum';
import { KeywordEnum } from '../../enums/keyword.enum';

export class SpecParser {

    run(data: ts.SourceFile): ParseSpecResult {
        const imports = this.parseImportStatements(data);
        const tree = this.buildTree(data);

        return new ParseSpecResult({ imports, tree });
    }

    private buildTree(data: ts.SourceFile): SpecTreeNode | undefined {
        const selector = `${AstNodeType.CALL_EXPRESSION} ${AstNodeType.IDENTIFIER}[text=${NodeType.DESCRIBE}]`;
        const documentationNode = tsquery.query<ts.Identifier>(data, selector)
            .map(node => node.parent as ts.CallExpression)
            .filter(node => node.arguments[0].getText().includes(`#documentation`))[0];

        if (!documentationNode) {
            console.log(`SKIPPED ${data.fileName}: dont found ${NodeType.DESCRIBE} with "#documentation" title`);
            return;
        }

        const middleNode = this.buildNode(documentationNode);
        middleNode.parent = this.searchParent(documentationNode, middleNode);
        middleNode.children = this.searchChildren(documentationNode, middleNode);

        return this.getRootTree(middleNode);
    }

    private searchChildren(node: ts.Node, parent: SpecTreeNode): SpecTreeNode[] {
        return this.getStatementsInsideNode(node).filter(statement => {
            return ts.isExpressionStatement(statement) && this.isSpecTreeNodeTyped(statement.expression);
        })
            .map(statement => (statement as ts.ExpressionStatement).expression as ts.CallExpression)
            .map(child => {
                const childSpecNode = this.buildNode(child);
                childSpecNode.parent = parent;
                childSpecNode.children = this.searchChildren(child, childSpecNode);
                return childSpecNode;
            });
    }

    private searchParent(node: ts.Node, child: SpecTreeNode): SpecTreeNode | undefined {
        const parent = node.parent;

        if (!Boolean(parent)) {
            return;
        }

        if (this.isSpecTreeNodeTyped(parent)) {
            const parentSpecNode = this.buildNode(parent as ts.CallExpression);
            parentSpecNode.parent = this.searchParent(parent, parentSpecNode);
            parentSpecNode.children = [child];
            return parentSpecNode;
        }

        return this.searchParent(parent, child);
    }

    private getRootTree(node: SpecTreeNode): SpecTreeNode {
        if (!Boolean(node.parent)) {
            return node;
        }

        return this.getRootTree(node.parent as SpecTreeNode);
    }

    // noinspection JSMethodCanBeStatic
    private isSpecTreeNodeTyped(node: ts.Node): boolean {
        return ts.isCallExpression(node)
            && [`${NodeType.DESCRIBE}`, `${NodeType.IT}`].includes(node.expression.getText());
    }

    private buildNode(node: ts.CallExpression): SpecTreeNode {
        const type = node.expression.getText() as NodeType;
        // Take name spec and remove extra quotes
        const title = node.arguments[0].getText().replace(/'/g, '');

        // Collect required statements
        const statements = this.getStatementsInsideNode(node)
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

            const isBinaryExpression = ts.isExpressionStatement(statement)
                && ts.isBinaryExpression(statement.expression);
            let hasExpression = false;
            if (isBinaryExpression) {
                const expression = (statement as ts.ExpressionStatement).expression as ts.BinaryExpression;
                hasExpression = keywords.includes(expression.left.getText());
            }

            return hasDeclaration || hasExpression;
        });

        let filteredStatements = [];
        if (reversedIndex !== -1) {
            filteredStatements = copyContainerStatement.slice(reversedIndex).reverse();
        } else {
            filteredStatements = copyContainerStatement.reverse();
        }

        return new SpecTreeNode({ type, title, statements: filteredStatements });
    }

    // noinspection JSMethodCanBeStatic
    private getStatementsInsideNode(node: ts.Node): ts.Statement[] {
        const selector = `${AstNodeType.CALL_EXPRESSION} Block`;
        const block = tsquery.query<ts.Block>(node, selector)[0];
        // Receive only collection statements, filter props 'pos', 'end'
        return block.statements.filter(statement => typeof statement === 'object');
    }

    private parseImportStatements(data: ts.SourceFile): Map<string, string[]> {
        const imports = new Map<string, string[]>();

        tsquery.query<ts.ImportDeclaration>(data, AstNodeType.IMPORT_DECLARATION)
            .forEach(node => {
                const importText = node.getText();
                imports.set(importText, []);
                tsquery.query(node, `${AstNodeType.IMPORT_CLAUSE} ${AstNodeType.IDENTIFIER}`)
                    .forEach(identifier => {
                        // @ts-ignore
                        imports.get(importText).push(identifier.getText());
                    });
            });

        return imports;
    }
}
