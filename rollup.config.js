import esbuild, { minify } from 'rollup-plugin-esbuild';

const bundle = config => ({
    ...config,
    input: 'src/index.ts',
});

export default [
    bundle({
        plugins: [esbuild(), minify()],
        output: [
            {
                file: `dist/json-cursor-path.min.js`,
                name: 'window',
                extend: true,
                format: 'iife',
            },
        ],
    }),
    bundle({
        plugins: [esbuild(), minify()],
        output: [
            {
                file: `build/index.cjs`,
                format: 'cjs',
            },
        ],
    }),
];
