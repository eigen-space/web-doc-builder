import { ParseSpecResult } from '../../entities/parse-spec-result/parse-spec-result';
import { prepareExample } from './builder';
import { tsquery } from '@phenomnomnominal/tsquery';
import { parseSpec } from '../parser/parser';

describe('Builder', () => {

    function getExample(data: string): string | undefined {
        const ast = tsquery.ast(data);
        const result = parseSpec(ast);

        return prepareExample(result);
    }

    function getExpectedResult(title: string, imports: string[], statements: string[], jsx: string): string {
        return [
            `${title}:`,
            '```jsx',
            `${imports.join('\n')}`,
            `${statements.join('\n')}`,
            jsx,
            '```'
        ].join('\n\n');
    }

    it('should return undefined when `ParseSpecResult` tree is empty', async () => {
        const result = new ParseSpecResult();
        expect(prepareExample(result)).not.toBeDefined();
    });

    it('should correct build example', () => {
        const statements = ['function a() {}', 'const component = <Component/>;'];
        const imports = `import React from 'react';`;
        const data = `
            ${imports}
            describe('Component', () => {
                ${statements[0]}
                describe('#documentation', () => {
                    it('subtitle', () => {
                        ${statements[1]}
                    })
                })
            })
        `;

        const example = getExample(data);

        const expected = getExpectedResult('subtitle', [imports], [statements[0]], '<Component/>');
        expect(example).toEqual(expected);
    });

    it('should ignore statements after creating components', () => {
        const statements = ['const component = <Component/>;', 'component = <Jsx/>;'];
        const data = `
            describe('Component', () => {
                ${statements[0]}
                describe('#documentation', () => {
                    it('subtitle', () => {
                        ${statements[1]}
                    })
                })
            })
        `;

        const example = getExample(data);

        const expected = getExpectedResult(`subtitle`, [], [], `<Jsx/>`);

        expect(example).toEqual(expected);
    });

    it('should filter duplicate import', () => {
        const statements = ['const x = React.get();', 'const b = React.get();', 'component = <Jsx/>'];
        const imports = `import React from './React';`;
        const data = `
            ${imports}
            describe('Component', () => {
                ${statements[0]}
                describe('#documentation', () => {
                    it('subtitle', () => {
                        ${statements[1]}
                        ${statements[2]}
                    })
                })
            })
        `;

        const example = getExample(data);

        const expected = getExpectedResult(`subtitle`, [imports], statements.slice(0, 2), `<Jsx/>`);

        expect(example).toEqual(expected);
    });
});
