module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "airbnb-base",
        "plugin:node/recommended",
        "async",
        "async/node",
        "eslint:recommended",
    ],
    // extends: "airbnb-base",
    overrides: [
    ],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    rules: {
        indent: 0, // allow any indentation style
        quotes: ["error", "double", { allowTemplateLiterals: true }], // must use double quotes and allow template literals
        "spaced-comment": ["error", "always"], // must have space after //
        "linebreak-style": 0, // allow windows and unix linebreaks
        "class-methods-use-this": 0, // allow class methods to not use this
        "import/extensions": ["error", "always", { js: "always" }], // must have .js extension while importing
        "no-plusplus": ["error", { allowForLoopAfterthoughts: true }], // allow ++ in for loop
        "object-curly-newline": 0, // must have consistent object curly newlines
        "no-console": ["warn", { allow: ["warn", "error", "info"] }],
        "require-await": "error", // if function is async but doest use await inside  then show error,
        "node/no-sync": ["error", { allowAtRootLevel: true }], // don't use any synchronous file read method
        "max-classes-per-file": ["error", 5], // allow to write 5 classess in a file by default 1
        "max-len": 0,
        "node/no-unpublished-import": 0,
        "lines-between-class-members": 0, // allow to write multiple lines between class members
        "no-process-exit": 0, // must use process.exit() instead of exit()
        "no-underscore-dangle": 0,
        "no-unused-vars": 0,
        "node/no-unsupported-features/es-syntax": 0,
        "no-useless-escape": 0,
        "node/no-unsupported-features/es-builtins": ["error", { version: ">=12.9.0" }],
        // "try-catch-always": "error", // must use try catch in async function
        // "eslint no-console": 0,
    },
};
