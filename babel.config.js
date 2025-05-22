module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            ["dotenv-import", {
                "moduleName": "@env",
                "path": `.env.${process.env.NODE_ENV || "dev"}`,
                "safe": false,
                "allowUndefined": true
            }]
        ]
    };
};