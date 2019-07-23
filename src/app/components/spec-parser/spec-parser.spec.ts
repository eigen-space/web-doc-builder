import { tsquery } from '@phenomnomnominal/tsquery';
import { NodeType } from '../../enums/node.enum';
import { SpecParser } from './spec-parser';

describe('SpecParser', () => {
    const parser = new SpecParser();

    it('should return empty `ParseSpecResult` when input data empty', () => {
        const data = tsquery.ast('');
        const result = parser.run(data);

        expect(result.imports).toEqual(new Map());
        expect(result.tree).toBeNull();
    });

    it('should correct parse named imports', () => {
        const importStatement = 'import { Props, Component } from \'./component\'';
        const ast = tsquery.ast(importStatement);

        const result = parser.run(ast);

        const expectedImportsStorage = new Map<string, string[]>([[importStatement, ['Props', 'Component']]]);
        expect(result.imports.size).toEqual(expectedImportsStorage.size);
        expect(result.imports.get(importStatement)).toEqual(expectedImportsStorage.get(importStatement));
    });

    it('should correct parse namespace imports', () => {
        const importStatement = 'import * as Props from \'./component\'';
        const ast = tsquery.ast(importStatement);

        const result = parser.run(ast);

        const expectedImportsStorage = new Map<string, string[]>([[importStatement, ['Props']]]);
        expect(result.imports.size).toEqual(expectedImportsStorage.size);
        expect(result.imports.get(importStatement)).toEqual(expectedImportsStorage.get(importStatement));
    });

    it('should correct parse default imports', () => {
        const importStatement = 'import Props from \'./component\'';
        const ast = tsquery.ast(importStatement);

        const result = parser.run(ast);

        const expectedImportsStorage = new Map<string, string[]>([[importStatement, ['Props']]]);
        expect(result.imports.size).toEqual(expectedImportsStorage.size);
        expect(result.imports.get(importStatement)).toEqual(expectedImportsStorage.get(importStatement));
    });

    it('should dont parse spec body if there is no block `#documentation`', () => {
        const data = `
            describe('Component', () => {
                describe('#state managers', () => {})
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).toBeNull();
    });

    it('should correct create nodes with required fields', () => {
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {})
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        expect(result.tree && result.tree.type).toEqual(NodeType.DESCRIBE);
        expect(result.tree && result.tree.title).toEqual('Component');
        expect(result.tree && result.tree.children.length).toEqual(1);
        expect(result.tree && result.tree.children[0].type).toEqual(NodeType.DESCRIBE);
        expect(result.tree && result.tree.children[0].title).toEqual('#documentation');
    });

    it('should correct parse statements binary expression type', () => {
        const statement = 'jsx = <Component>;';
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    ${statement}
                })
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        expect(result.tree && result.tree.children[0].statements.length).toEqual(1);
        expect(result.tree && result.tree.children[0].statements[0].getText()).toEqual(statement);
    });

    it('should correct parse statements variable statement type', () => {
        const statement = 'const jsx = <Component>;';
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    ${statement}
                })
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        expect(result.tree && result.tree.children[0].statements.length).toEqual(1);
        expect(result.tree && result.tree.children[0].statements[0].getText()).toEqual(statement);
    });

    it('should correct parse statements function declaration type', () => {
        const statement = 'function a() {}';
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    ${statement}
                })
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        expect(result.tree && result.tree.children[0].statements.length).toEqual(1);
        expect(result.tree && result.tree.children[0].statements[0].getText()).toEqual(statement);
    });

    it('should filter statements after creating component statement as variable declaration', () => {
        const statements = ['const component = <Component/>', 'function a() {};'];
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    ${statements.join('\n')}
                })
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        expect(result.tree && result.tree.children[0].statements.length).toEqual(1);
        expect(result.tree && result.tree.children[0].statements[0].getText()).toEqual(statements[0]);
    });

    it('should filter statements after creating component statement as binary expression', () => {
        const statements = ['jsx = <Jsx/>', 'function a() {};'];
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    ${statements.join('\n')}
                })
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        expect(result.tree && result.tree.children[0].statements.length).toEqual(1);
        expect(result.tree && result.tree.children[0].statements[0].getText()).toEqual(statements[0]);
    });

    it('should correct parse children inside #documentation', () => {
        const statement = `
            it('subtitle', () => {
                jsx = <Jsx/>
            })
        `;
        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    ${statement}
                })
            })
        `;
        const ast = tsquery.ast(data);

        const result = parser.run(ast);

        expect(result.tree).not.toBeNull();
        const documentationBlock = result.tree && result.tree.children[0];
        const test = documentationBlock && documentationBlock.children[0];
        expect(test && test.type).toEqual(NodeType.IT);
        expect(test && test.title).toEqual('subtitle');
        expect(test && test.parent).not.toBeNull();
        expect(test && test.children).toEqual([]);
        expect(test && test.statements[0].getText()).toEqual('jsx = <Jsx/>');
    });
});
