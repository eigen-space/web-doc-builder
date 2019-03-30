# About
Doc-builder is a tool for generating documentation on the specification of ui component. The specification must be
described by [some rules](https://www.notion.so/arrivalms/Doc-generation-d59844854d0d4b26a67bfc653a50cb36). The result of 
the generation is a markdown file containing examples of using the components.

# Install
To install this package, you should have acces to registry https://artifacts.arrival.services.
```sh
$ npm install --save-dev @arrival/doc-builder
```
or
```sh
$ yarn add --dev @arrival/doc-builder
```

# How to use
To generate the documentation, just call the method and pass  as parameter the directory where the specification
files are located.
```node
    const builder = require('@arrival/doc-builder');
    
    const dir = 'src/components';
    builder.generate(dir);
```
The generated example files will be located next to the specification files.

# Dependencies

[@phenomnomnominal/tsquery](https://github.com/phenomnomnominal/tsquery) helps us parse specification.

[typescript](https://github.com/Microsoft/TypeScript) types entities

[@eigenspace/helper-scripts](https://github.com/eigen-space/helper-scripts) helps us search files in source directory 
