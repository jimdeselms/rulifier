import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'

export default [
    {
        input: "src/index.js",
        plugins: [commonjs(), terser()],
        output: {
            sourcemap: true,
            file: "dist/index.esm.js",
            format: "esm"
        }
    },
    {
        input: "src/index.js",
        plugins: [commonjs(), terser()],
        output: {
            name: "Rulifier",
            sourcemap: true,
            file: "dist/index.umd.js",
            format: "umd"
        }
    }
]