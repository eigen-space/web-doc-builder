import * as fs from 'fs';
import * as path from 'path';
import { tsquery } from '@phenomnomnominal/tsquery';
import { walkThrough } from '@eigenspace/helper-scripts';
import { DocExampleBuilder } from '../doc-example-builder/doc-example-builder';
import { SpecParser } from '../spec-parser/spec-parser';

export type Paths = string[];

export class DocGenerator {
    private builder = new DocExampleBuilder();
    private parser = new SpecParser();

    run(paths: Paths = ['src/components']): void {
        paths.forEach(param => fs.statSync(param).isFile() ? this.processFile(param) : this.processDir(param));
    }

    private processDir(dirPath: string): void {
        walkThrough(
            dirPath,
            (currentDir: string, file: string) => {
                this.processFile(path.resolve(currentDir, file));
            }
        );
    }

    private processFile(filePath: string): void {
        const file = path.basename(filePath);
        if (!fs.statSync(filePath).isFile() || !file.match(/.spec.tsx$/g)) {
            return;
        }

        fs.readFile(filePath, 'utf8', (readError: NodeJS.ErrnoException, data: string) => {
            if (readError) {
                throw readError;
            }

            const example = this.makeDoc(file, data);

            if (example != null) {
                const docName = `${file.split('.')[0]}.md`;
                const savedFilePath = path.resolve(path.dirname(filePath), docName);

                fs.writeFile(savedFilePath, example, writeError => {
                    const status = writeError ? 'Failure' : 'Success';
                    // eslint-disable-next-line no-console
                    console.log(`${status}: ${savedFilePath}`);
                });
            }
        });
    }

    // noinspection JSMethodCanBeStatic
    private makeDoc(name: string, fileData: string): string | undefined {
        const ast = tsquery.ast(fileData, name);
        const result = this.parser.run(ast);
        return this.builder.run(result);
    }
}
