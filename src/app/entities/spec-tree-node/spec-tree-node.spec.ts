import { NodeType } from '../../enums/node.enum';
import { SpecTreeNode } from './spec-tree-node';
import * as ts from 'typescript';

describe('SpecTreeNode', () => {

    it('should correct create object', () => {
        const parent = new SpecTreeNode({
            type: NodeType.DESCRIBE,
            title: 'parent'
        });
        const children = [new SpecTreeNode({
            type: NodeType.IT,
            title: 'child'
        })];
        const options = {
            type: NodeType.DESCRIBE,
            title: 'title',
            parent,
            children,
            statements: [{ kind: ts.SyntaxKind.AsKeyword }] as ts.Statement[]
        };
        const specTreeNode = new SpecTreeNode(options);

        expect(specTreeNode.title).toEqual(options.title);
        expect(specTreeNode.type).toEqual(options.type);
        expect(specTreeNode.parent).toEqual(options.parent);
        expect(specTreeNode.children).toEqual(options.children);
        expect(specTreeNode.statements).toEqual(options.statements);
    });

    it('should corect create object only with required parameters', () => {
        const options = {
            type: NodeType.DESCRIBE,
            title: 'title'
        };
        const specTreeNode = new SpecTreeNode(options);

        expect(specTreeNode.parent).not.toBeDefined();
        expect(specTreeNode.children).toEqual([]);
        expect(specTreeNode.statements).toEqual([]);
    });
});
