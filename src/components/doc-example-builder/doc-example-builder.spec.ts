import { ParseSpecResult } from '../../entities/parse-spec-result/parse-spec-result';
import { build} from './doc-example-builder';
import { tsquery } from '@phenomnomnominal/tsquery';
import { parse } from '../spec-parser/spec-parser';

describe('DocExampleBuilder', () => {

    function getExample(data: string): string | undefined {
        const ast = tsquery.ast(data, 'example.tsx');
        const result = parse(ast);

        return build(result);
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
        expect(build(result)).not.toBeDefined();
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

    it('should process multiline component with brackets correctly', () => {
        // noinspection HtmlUnknownAttribute
        const component = [
                `<CardsContainer {...props}>`,
                `    <Card description='Mercedes' fullHeight={true} theme={theme}/>`,
                `        {children}`,
                `    <Card description='Ferrari' theme={theme}/>`,
                `</CardsContainer>`
            ].join('\n');

        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    it('subtitle', () => {
                        const component = (
                            ${component}
                        );
                    })
                })
            })
        `;

        const example = getExample(data);

        const expected = getExpectedResult(`subtitle`, [], [], component);

        expect(example).toEqual(expected);
    });

    it('should process multiline component without brackets correctly', () => {
        // noinspection HtmlUnknownAttribute
        const component = [
            `<CardsContainer {...props}>`,
            `    <Card description='Mercedes' fullHeight={true} theme={theme}/>`,
            `        {children}`,
            `    <Card description='Ferrari' theme={theme}/>`,
            `</CardsContainer>`
        ].join('\n');

        const data = `
            describe('Component', () => {
                describe('#documentation', () => {
                    it('subtitle', () => {
                        const component =
                            ${component};
                    })
                })
            })
        `;

        const example = getExample(data);

        const expected = getExpectedResult(`subtitle`, [], [], component);

        expect(example).toEqual(expected);
    });

    it('should filter correct processing named imports', () => {
        const statements = ['const x = React.get();', 'const b = renderer.get();', 'component = <Jsx/>'];
        const imports = `import { React, renderer } from './React';`;
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

        const expectedImports = `import { React, renderer } from './React';`;
        const expected = getExpectedResult(
            `subtitle`,
            [expectedImports],
            statements.slice(0, 2),
            `<Jsx/>`
        );

        expect(example).toEqual(expected);
    });

    it('should filter unused import identifiers from imports', () => {
        const statements = ['const x = React.get();', 'const b = React.get();', 'component = <Jsx/>'];
        const imports = `import { React, renderer } from './React';`;
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

        const expectedImports = `import { React } from './React';`;
        const expected = getExpectedResult(
            `subtitle`,
            [expectedImports],
            statements.slice(0, 2),
            `<Jsx/>`
        );

        expect(example).toEqual(expected);
    });

    it('should filter unused import statements', () => {
        const statements = ['const x = React.get();', 'component = <Jsx/>'];
        const imports = [
            `import { React } from './React';`,
            `import { NotReact } from './not-react';`
        ];
        const data = `
            ${imports.join('\n')}
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

        const expectedImports = `import { React } from './React';`;
        const expected = getExpectedResult(
            `subtitle`,
            [expectedImports],
            statements.slice(0, 1),
            `<Jsx/>`
        );

        expect(example).toEqual(expected);
    });
});
