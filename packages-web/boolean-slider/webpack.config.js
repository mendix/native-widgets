const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

 const widgetConfig = {
    entry: "./src/components/SwitchContainer.ts",
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: "src/com/mendix/widget/custom/switch/Switch.js",
        libraryTarget: "umd"
    },
    resolve: {
        extensions: [ ".ts", ".js", ".json" ]
    },
    module: {
        rules: [
            { test: /\.ts$/, use: "ts-loader" },
            {
                test: /\.css$/, loader: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: "css-loader"
            })
            },
            {
                test: /\.sass$/, loader: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader!sass-loader"
                }
            )
            }
        ]
    },
    devtool: "source-map",
    externals: [ "react", "react-dom" ],
    plugins: [
        new CleanWebpackPlugin("dist/tmp"),
        new CopyWebpackPlugin(
            [
                { from: "src/**/*.xml" },
                { from: "assets/Preview.png", to: "src/Preview.png" }
            ],
            { copyUnmodified: true }
        ),
        new ExtractTextPlugin({ filename: "./src/com/mendix/widget/custom/switch/ui/Switch.css" }),
        new webpack.LoaderOptionsPlugin({ debug: true })
    ]
};

const previewConfig = {
    entry: "./src/Switch.webmodeler.ts",
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: "src/Switch.webmodeler.js",
        libraryTarget: "commonjs"
    },
    resolve: {
        extensions: [ ".ts", ".js" ]
    },
    module: {
        rules: [
            { test: /\.ts$/, use: "ts-loader" },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.sass$/, use: [
                {
                    loader: "style-loader"
                },
                {
                    loader: "css-loader"
                },
                {
                    loader: "sass-loader"
                }
            ] }
        ]
    },
    devtool: "inline-source-map",
    externals: [ "react", "react-dom" ],
    plugins: [
        new webpack.LoaderOptionsPlugin({ debug: true })
    ]
};

module.exports = [ widgetConfig, previewConfig ];
