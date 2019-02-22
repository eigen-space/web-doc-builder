import { ParseSpecResult } from '../../entities/parse-spec-result/parse-spec-result';
import { SpecTreeNode } from '../../entities/spec-tree-node/spec-tree-node';
import * as ts from 'typescript';
import { NodeType } from '../../enums/node.enum';
import { tsquery } from '@phenomnomnominal/tsquery';
import { AstNodeType } from '../../enums/ast-node.enum';
import { KeywordEnum } from '../../enums/keyword.enum';

export function prepareExample(data: ParseSpecResult): string | undefined {
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

function createExample(nodes: SpecTreeNode[], imports: Map<string, string>): string {
    const importKeys = Array.from(imports.keys());

    const example: string[] = [];

    nodes.forEach(node => {
        const filteredKeys: string[] = ['React'];
        node.statements.forEach(statement => {
            const keysInStatement = importKeys.filter(key => {
                return Boolean(tsquery.query(statement, `${AstNodeType.IDENTIFIER}[text=${key}]`).length);
            })
                .filter(key => !filteredKeys.includes(key));

            filteredKeys.push(...keysInStatement);
        });

        const importFragments = filteredKeys.map(key => {
            const str = imports.get(key);
            return str && str.trim();
        }).join('\n');
        const statementTexts = node.statements.map(statement => statement.getFullText());

        // Get right-side part of component statement
        // istanbul ignore next
        const componentText = statementTexts.pop() || '';
        const jsx = removeDeclarationFromJsx(componentText);

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

function removeDeclarationFromJsx(str: string): string {
    const match = str.match(/[a-z].*=\s/);
    // JSX component must be binary expression by default
    // istanbul ignore next
    str = match ? str.replace(match[0], '') : str;
    return str.endsWith(';') ? str.slice(0, -1) : str;
}

function prettify(str: string): string {
    str = str.replace(/^\r?\n/gm, '');
    const firstSymbolIndex = str.search(/[^\s]/);
    const indent = ' '.repeat(firstSymbolIndex);
    return str.split(`${indent}`).join('');
}