import { NodeType } from '../../enums/node.enum';
import * as ts from 'typescript';

interface SpecTreeNodeOptions {
    type: NodeType;
    title: string;
    parent?: SpecTreeNode;
    children?: SpecTreeNode[];
    statements?: ts.Statement[];
}

export class SpecTreeNode {
    type: NodeType;
    title: string;
    parent: SpecTreeNode | undefined;
    children: SpecTreeNode[] | [];
    statements: ts.Statement[];

    constructor(data: SpecTreeNodeOptions) {
        this.type = data.type;
        this.title = data.title;
        this.parent = data.parent;
        this.children = data.children || [];
        this.statements = data.statements || [];
    }
}