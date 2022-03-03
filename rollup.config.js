import commonjs from '@rollup/plugin-commonjs'
import minify from 'rollup-plugin-babel-minify'
import { terser } from 'rollup-plugin-terser'

export default [
    {
        input: "src/index.js",
        plugins: [commonjs(), minify(), terser()],
        output: {
            sourcemap: true,
            file: "dist/index.esm.js",
            format: "esm"
        }
    },
    {
        input: "src/index.js",
        plugins: [commonjs(), minify(), terser()],
        output: {
            name: "Rulifier",
            sourcemap: true,
            file: "dist/index.umd.js",
            format: "umd"
        }
    }
]