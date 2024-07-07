import esbuild, { minify } from 'rollup-plugin-esbuild';

const NAME = 'json-cursor-path';

const bundle = config => ({
    ...config,
    input: `src/${NAME}.ts`,
});

export default [
    bundle({
        plugins: [esbuild(), minify()],
        output: [
            {
                file: `dist/${NAME}.min.js`,
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
                file: `build/${NAME}.cjs`,
                format: 'cjs',
            },
        ],
    }),
];
