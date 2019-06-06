# About [![Build Status](http://ci.smekalka.com/buildStatus/icon?job=ams.doc-builder)](http://ci.smekalka.com/view/AMS/job/ams.doc-builder/)

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
There are 2 methods to generate documentation
1. Just call the method and pass as parameter the directories where the specification
   files are located or files, or both directories and files together.
    ```node
        new DocGenerator().run(['src', 'src/spec.tsx']);
    ```
2. Run script index.js with params
    ```node
        node node_modules/@arrival/doc-builder/index.js --src src src/spec.tsx
    ```
The generated example files will be located next to the specification files.

# Why do we have that dependencies?

* `@phenomnomnominal/tsquery` - helps us parse specification.
* `@eigenspace/helper-scripts` - common scripts for dev. environment.

# Why do we have that dev dependencies?

* `@eigenspace/codestyle` - includes tslint rules, config for typescript.
* `@types/*` - contains type definitions for specific library.
* `jest` - testing framework to write unit specs (including snapshots).
* `ts-jest` - it lets you use Jest to test projects written in TypeScript.
* `ts-loader` - it is used to load typescript code with webpack. 
* `tslint` - it checks TypeScript code for readability, maintainability, and functionality errors.
* `typescript` - is a superset of JavaScript that have static type-checking and ECMAScript features.
See `webpack.config.js`.
* `webpack` - it create app bundle for dev mode and production. 
* `copy-webpack-plugin` - used for copy package.json in package bundle.
* `clean-webpack-plugin` - used for clean bundle before run building.
* `husky` - used for configure git hooks.
* `lint-staged` - used for configure linters against staged git files.
* `webpack-cli` - command line interface dor webpack.