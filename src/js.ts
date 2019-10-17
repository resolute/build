import { rollup } from 'rollup';
import uglify from 'uglify-es';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript';
import { each, hash } from './util';

const js = ([config]) => each(['*.js', '*.ts'], { cwd: config.build.jsDir }, ({ file, base }) =>
    rollup({
        input: base + '/' + file,
        plugins: [
            json(),
            typescript({
                "paths": {
                    "*": ["types/*"]
                },
                "baseUrl": ".",
                "resolveJsonModule": true,
                "moduleResolution": "node",
                "downlevelIteration": true,
                "target": config.build.legacy.test(file) ? "es5" : "esnext",
                "module": "esnext",
                "lib": ["esnext", "dom", "DOM.Iterable", "ScriptHost"],
                "strict": false,
                "sourceMap": true,
                "declaration": true,
                "allowSyntheticDefaultImports": true,
                "experimentalDecorators": true,
                "emitDecoratorMetadata": true,
                "typeRoots": [
                    "node_modules/@types"
                ]

            }),
            resolve({
                mainFields: ['module', 'main', 'main:jsnext'],
                browser: true,
                preferBuiltins: false
            }),
            commonjs(),
            ...(config.build.legacy.test(file) ? [
                babel({
                    presets: [
                        ['@babel/env', {
                            modules: false,
                            targets: { browsers: ['IE 11'] },
                            // useBuiltIns: 'usage', // 7beta not working properly
                            // debug: true
                        }]
                    ]
                }),
            ] : [])
        ]
    })
        .then((rollup) => rollup.generate({
            format: 'es',
            intro: (
                config.build.legacy.test(file) ?
                    '(function (window, document) {\n"use strict";' :
                    '(async (window, document) => {\n'
            ),
            outro: '})(window, document)'
        }))
        .then((v1fix) => 'output' in v1fix ? v1fix.output[0] : v1fix)
        .then(({ code }) => uglify.minify(code, {
            toplevel: true,
            warnings: true,
            compress: { toplevel: true, hoist_props: true, passes: 4 },
            mangle: { toplevel: true }
        }))
        .then(({ code }) => hash(file, code, 'js', `${config.build.webDir}/js`, config.build.inline.test(file)))
).then(arr => arr.reduce((acc, i) => ({ ...acc, ...i }), {})); // array of objects to single object

export default js;