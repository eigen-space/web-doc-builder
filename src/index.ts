import * as fs from 'fs';
import * as path from 'path';
import { tsquery } from '@phenomnomnominal/tsquery';
import { parse } from './components/spec-parser/spec-parser';
import { build } from './components/doc-example-builder/doc-example-builder';
import { walkThrough } from '@eigenspace/helper-scripts/scripts/common';

export function generate(dirPath: string): void {
    walkThrough(
        dirPath,
        (currentDir: string, file: string) => {
            const filePath = path.resolve(currentDir, file);
            if (!fs.statSync(filePath).isFile() || !file.match(/.spec.tsx$/g)) {
                return;
            }

            fs.readFile(filePath, 'utf8', (readError: NodeJS.ErrnoException, data: string) => {
                if (readError) {
                    throw readError;
                }

                const example = makeDoc(file, data);

                if (example != null) {
                    const docName = `${file.split('.')[0]}.md`;
                    const savedFilePath = path.resolve(currentDir, docName);

                    fs.writeFile(savedFilePath, example, writeError => {
                        const status = writeError ? 'Failure' : 'Success';
                        console.log(`${status}: ${savedFilePath}`);
                    });
                }
            });
        }
    );
}

function makeDoc(name: string, fileData: string): string | undefined {
    const ast = tsquery.ast(fileData, name);
    const result = parse(ast);
    return build(result);
}