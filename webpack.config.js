const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, './src/package-api.js'),
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    }
};
