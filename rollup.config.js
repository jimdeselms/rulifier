import commonjs from '@rollup/plugin-commonjs'

export default [
    {
        input: "src/index.js",
        plugins: [commonjs()],
        output: {
            file: "dist/index.esm.js",
            sourcemap: true,
            format: "esm"
        }
    },
    {
        input: "src/index.js",
        plugins: [commonjs()],
        output: {
            name: "rulifier",
            file: "dist/index.umd.js",
            sourcemap: true,
            format: "umd"
        }
    }
]