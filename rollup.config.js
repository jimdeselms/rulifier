import minify from 'rollup-plugin-babel-minify'

export default [
    {
        input: "src/index.js",
        plugins: [minify()],
        output: {
            sourcemap: true,
            file: "dist/index.cjs.js",
            format: "cjs"
        }
    },
    {
        input: "src/index.js",
        plugins: [minify()],
        output: {
            sourcemap: true,
            file: "dist/index.esm.js",
            format: "esm"
        }
    }
]