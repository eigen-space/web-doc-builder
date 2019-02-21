const path = require('path');
const fs = require('fs');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const DtsBundlePlugin = require('dts-bundle/lib/dts-bundle-webpack');

const packageJson = fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf8');
const libraryName = JSON.parse(packageJson).name;

module.exports = {
    entry: path.resolve(__dirname, 'src/package-api.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: libraryName,
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin('./dist/*'),
        new CopyWebpackPlugin([
            { from: 'package.json', to: 'package.json' },
            { from: 'README.md', to: 'README.md' }
        ]),
        new DtsBundlePlugin({
            name: libraryName,
            // Because a dts bundle module clear 2 last symbols before splitting
            baseDir: './dist//',
            main: './dist/types/**/*.d.ts',
            out: './index.d.ts'
        })
    ],
    externals: {
        typescript: {
            root: 'typescript',
            commonjs2: 'typescript'
        },
        '@eigenspace/helper-scripts': {
            root: '@eigenspace/helper-scripts',
            commonjs2: '@eigenspace/helper-scripts'
        },
        '@phenomnomnominal/tsquery': {
            root: '@phenomnomnominal/tsquery',
            commonjs2: '@phenomnomnominal/tsquery'
        }
    },
    target: 'node',
    stats: {
        warnings: false
    }
};