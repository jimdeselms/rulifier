import minify from 'rollup-plugin-babel-minify'
import cleanup from 'rollup-plugin-cleanup'

export default [
    {
        input: "src/index.js",
        // plugins: [minify(), cleanup()],
        output: {
            sourcemap: true,
            file: "dist/index.cjs.js",
            format: "cjs"
        }
    },
    {
        input: "src/index.js",
        // plugins: [minify(), cleanup()],
        output: {
            sourcemap: true,
            file: "dist/index.esm.js",
            format: "esm"
        }
    }
]