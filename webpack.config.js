const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

module.exports = {
    entry: "./src/entry.js",
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [["@babel/preset-env"]],
                        generatorOpts: {
                            compact: false,
                        },
                        // https://babeljs.io/docs/assumptions#migrating-from-babelpreset-envs-loose-and-spec-modes
                        assumptions: {
                            arrayLikeIsIterable: true,
                            constantReexports: true,
                            ignoreFunctionLength: true,
                            ignoreToPrimitiveHint: true,
                            mutableTemplateObject: true,
                            noClassCalls: true,
                            noDocumentAll: true,
                            objectRestNoSymbols: true,
                            privateFieldsAsProperties: true,
                            pureGetters: true,
                            setClassMethods: true,
                            setComputedProperties: true,
                            setPublicClassFields: true,
                            setSpreadProperties: true,
                            skipForOfIteratorClosing: true,
                            superIsCallableConstructor: true,
                        },
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ["*", ".js"],
    },
    mode: "production",
    optimization: {
        minimize: false,
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: fs.readFileSync("./src/license.js", "utf8"),
            raw: true,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
        }),
    ],
    output: {
        filename: "SkyBlockTimeEngine-es5.js",
        path: path.resolve(__dirname, "dist"),
    },
};
