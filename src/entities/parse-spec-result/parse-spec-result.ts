import { SpecTreeNode } from '../spec-tree-node/spec-tree-node';

export interface ParseSpecResultOptions {
    imports?: Map<string, string>;
    tree?: SpecTreeNode;
}

export class ParseSpecResult {
    imports: Map<string, string>;
    tree: SpecTreeNode | null;

    constructor(data = {} as ParseSpecResultOptions) {
        this.imports = data.imports || new Map();
        this.tree = data.tree || null;
    }
}