import minify from 'rollup-plugin-babel-minify'
import cleanup from 'rollup-plugin-cleanup'
import commonjs from '@rollup/plugin-commonjs'

export default [
    {
        input: "src/index.js",
        plugins: [commonjs(), minify(), cleanup()],
        output: {
            sourcemap: true,
            file: "dist/index.esm.js",
            format: "esm"
        }
    },
    {
        input: "src/index.js",
        plugins: [commonjs(), minify(), cleanup()],
        output: {
            name: "Rulifier",
            sourcemap: true,
            file: "dist/index.umd.js",
            format: "umd"
        }
    }
]