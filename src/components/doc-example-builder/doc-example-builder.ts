import { ParseSpecResult } from '../../entities/parse-spec-result/parse-spec-result';
import { SpecTreeNode } from '../../entities/spec-tree-node/spec-tree-node';
import * as ts from 'typescript';
import { NodeType } from '../../enums/node.enum';
import { tsquery } from '@phenomnomnominal/tsquery';
import { AstNodeType } from '../../enums/ast-node.enum';
import { KeywordEnum } from '../../enums/keyword.enum';

export function build(data: ParseSpecResult): string | undefined {
    const tree = data.tree;
    if (tree == null) {
        return;
    }

    const nodes = collectExampleStatements(tree);
    return createExample(nodes, data.imports);
}

function collectExampleStatements(tree: SpecTreeNode): SpecTreeNode[] {
    const queue = [tree];

    const summaryStatementsInNodes = new Map<string, ts.Statement[]>();
    const resultNodes: SpecTreeNode[] = [];

    while (queue.length) {
        const node = queue.shift();
        // Object is possibly 'null' or 'undefined'?
        // istanbul ignore next
        if (node === undefined) {
            continue;
        }

        queue.push(...node.children);

        const parent = node.parent;
        if (parent == null) {
            summaryStatementsInNodes.set(node.title, node.statements);
            continue;
        }

        // istanbul ignore next
        let actualStatements = summaryStatementsInNodes.get(parent.title) || [];

        const hasOwnComponentStatement = node.statements.map(statement => statement.getText())
            .some(statement => getComponentExpressionMatcher().test(statement));

        if (hasOwnComponentStatement) {
            const position = actualStatements.map(statement => statement.getText())
                .findIndex(statement => getComponentExpressionMatcher().test(statement));

            if (position >= 0) {
                actualStatements = [...actualStatements];
                actualStatements.splice(position, 1);
            }
        }

        const mergedStatements = [...actualStatements, ...node.statements];

        summaryStatementsInNodes.set(node.title, mergedStatements);

        if (node.type === NodeType.IT) {
            resultNodes.push(new SpecTreeNode({ ...node, statements: mergedStatements }));
        }
    }

    return resultNodes;
}

function getComponentExpressionMatcher(): RegExp {
    return new RegExp(`(${KeywordEnum.JSX}|${KeywordEnum.COMPONENT}) = `, 'g');
}

function createExample(nodes: SpecTreeNode[], imports: Map<string, string[]>): string {

    const example: string[] = [];

    nodes.forEach(node => {
        const importFragments = buildImportFragments(node, imports);
        const statementTexts = node.statements.map(statement => statement.getFullText());

        // Get right-side part of component statement
        // istanbul ignore next
        const componentText = statementTexts.pop() || '';
        const jsx = jsxToExpression(componentText);

        const statementFragments = statementTexts.map(txt => prettify(txt)).join('\n');
        example.push([
            `${node.title}:`,
            '```jsx',
            `${importFragments}`,
            `${statementFragments}`,
            `${prettify(jsx)}`,
            '```'
        ].join('\n\n'));
    });

    return example.join('\n\n');
}

function buildImportFragments(node: SpecTreeNode, imports: Map<string, string[]>): string[] {
    const filteredKeys: string[] = ['React'];

    node.statements.forEach(statement => {
        imports.forEach((identifiers) => {
            const keysInStatement = identifiers.filter(key => {
                return Boolean(tsquery.query(statement, `${AstNodeType.IDENTIFIER}[text=${key}]`).length);
            })
                .filter(key => !filteredKeys.includes(key));

            filteredKeys.push(...keysInStatement);
        });
    });

    return Array.from(imports.keys())
        .map(importText => {
            // Incorrect behaviour. Array as value is by default
            // istanbul ignore next
            const identifiers = imports.get(importText) || [];
            const isNamedImports = identifiers.length > 1;

            if (!isNamedImports) {
                return importText;
            }

            const requiredImports = identifiers.filter(identifier => filteredKeys.includes(identifier));
            return importText.replace(/{ (.*?) }/, `{ ${requiredImports.join(',')} }`);
        });
}

function jsxToExpression(str: string): string {
    const rightSide = removeDeclarationFromJsx(str);
    return removeExtraCharacters(rightSide);
}

function removeDeclarationFromJsx(str: string): string {
    const match = str.match(/[a-z].*=\s/);
    // JSX component must be binary expression by default
    // istanbul ignore next
    return match ? str.replace(match[0], '') : str;
}

function removeExtraCharacters(str: string): string {
    const noSemicolon = str.endsWith(';') ? str.slice(0, -1) : str;
    return noSemicolon.trim().startsWith('(') ? noSemicolon.trim().slice(1, -1) : noSemicolon;
}

function prettify(str: string): string {
    str = str.replace(/^\r?\n/gm, '');
    const firstSymbolIndex = str.search(/[^\s]/);
    const indent = ' '.repeat(firstSymbolIndex);
    const startWithIndent = new RegExp(`^${indent}`, 'gm');
    return str.replace(startWithIndent, '').trim();
}