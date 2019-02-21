import { NodeType } from '../../enums/node.enum';
import { SpecTreeNode } from '../spec-tree-node/spec-tree-node';
import { ParseSpecResult } from './parse-spec-result';

describe('ParseSpecResult', () => {

    it('should correct create object', () => {
        const tree = new SpecTreeNode({ type: NodeType.DESCRIBE, title: 'parent' });
        const imports = new Map<string, string>([['key', 'import']]);
        const specTreeNode = new ParseSpecResult({ imports, tree });

        expect(specTreeNode.imports).toEqual(imports);
        expect(specTreeNode.tree).toEqual(tree);
    });

    it('should corect create object only with required parameters', () => {
        const specTreeNode = new ParseSpecResult();

        expect(specTreeNode.tree).toBeNull();
    });
});
