export default [
    {
        input: "src/index.js",
        plugins: [],
        output: {
            file: "dist/index.esm.js",
            sourcemap: true,
            format: "esm"
        }
    },
    {
        input: "src/index.js",
        plugins: [],
        output: {
            name: "rulifier",
            file: "dist/index.umd.js",
            sourcemap: true,
            format: "umd"
        }
    }
]