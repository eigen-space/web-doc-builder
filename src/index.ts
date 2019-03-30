import { ArgsParser } from './app/utils/args-parser';
import { DocGenerator } from './app/components/doc-generator/doc-generator';

const params = ArgsParser.get(process.argv.slice(2));

new DocGenerator().run(params.get('src'));
