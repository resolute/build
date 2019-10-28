import { each, hash } from './util';

import Rollup = require('rollup');
import resolve = require('rollup-plugin-node-resolve');
import commonjs = require('rollup-plugin-commonjs');
import babel = require('rollup-plugin-babel');
import json = require('rollup-plugin-json');
import typescript = require('rollup-plugin-typescript');
import terser = require('terser');

const { rollup } = Rollup;

const js = ([config]) => each(['*.js', '*.ts'], { cwd: config.build.jsDir }, ({ file, base }) =>
  rollup({
    input: `${base}/${file}`,
    plugins: [
      json(),
      typescript({
        paths: {
          '*': ['types/*'],
        },
        baseUrl: '.',
        resolveJsonModule: true,
        moduleResolution: 'node',
        downlevelIteration: true,
        target: config.build.legacy.test(file) ? 'es5' : 'esnext',
        module: 'esnext',
        lib: ['esnext', 'dom', 'DOM.Iterable', 'ScriptHost'],
        strict: false,
        sourceMap: true,
        declaration: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        typeRoots: [
          'node_modules/@types',
        ],

      }),
      // @ts-ignore not sure why this is acting up
      resolve({
        mainFields: ['module', 'main', 'main:jsnext'],
        browser: true,
        preferBuiltins: false,
      }),
      // @ts-ignore not sure why this is acting up
      commonjs(),
      ...(config.build.legacy.test(file) ? [
        babel({
          presets: [
            ['@babel/env', {
              modules: false,
              targets: { browsers: ['IE 11'] },
              // useBuiltIns: 'usage', // 7beta not working properly
              // debug: true
            }],
          ],
        }),
      ] : []),
    ],
  })
    .then((rollup) => rollup.generate({
      format: 'es',
      preferConst: true,
      intro: (
        config.build.legacy.test(file) ?
          '(function (window, document) {\n"use strict";' :
          'const window = self; const document = window.document;\n'
      ),
      outro: (
        config.build.legacy.test(file) ?
          '})(window, document)' :
          ''
      ),
    }))
    .then((v1fix) => ('output' in v1fix ? v1fix.output[0] : v1fix))
    .then(({ code }) => terser.minify(code, {
      toplevel: true,
      warnings: true,
      compress: { toplevel: true, hoist_props: true, passes: 4 },
      mangle: { toplevel: true },
    }))
    .then(({ code }) => hash(file, code, 'js', `${config.build.webDir}/js`, config.build.inline.test(file)))).then((arr) => arr.reduce((acc, i) => ({ ...acc, ...i }), {})); // array of objects to single object

export default js;
