import { DocGenerator, Paths } from './app/components/doc-generator/doc-generator';
import { ArgumentParser } from '@eigenspace/argument-parser';

const parser = new ArgumentParser();

const params = parser.get(process.argv.slice(2));
const srcParam = params.get('src') as Paths | undefined;

new DocGenerator().run(srcParam);
