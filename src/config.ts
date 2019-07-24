import fs from 'fs';
import util from 'util';
import { register } from 'ts-node';

import { deleteRequireCache } from './util';

if (Object.keys(require.extensions).indexOf('.ts') === -1) {
    // Node.js can require() `.ts` files
    register({
        project: `${process.cwd()}/tsconfig.json`
    });
}

const access = util.promisify(fs.access);

const config = () => Promise.all([
    'etc/build.config.ts',
    'etc/config.ts'
]
    .map((file) => access(`${process.cwd()}/${file}`)
        .then(() => file)
        .catch(() => false)
    )
)
    .then((files) => files.filter((truey) => truey))
    .then((files) => {
        files.forEach((file) => {
            deleteRequireCache(new RegExp(file + '$'));
        })
        if (files.length === 0) {
            throw 'no config found, using defaults';
        }
        return files[0];

    })
    .then((file) => import(`${process.cwd()}/${file}`))
    .catch((error) => {
        console.error(error);
        throw error;
        return {};
    })
    // .catch(() => ({}))
    .then((config) => ({
        // write every template file.marko to file.html
        html: /NOTHING/,
        // inline matching assets as <script>, <style> in templates
        inline: /NOTHING/,
        // use Babel on any file matching file-legacy.js
        legacy: /-legacy/,
        name: '',
        appDir: 'app',
        etcDir: 'etc',
        libDir: 'lib',
        svgDir: 'svg',
        tplDir: 'tpl',
        webDir: 'web',
        cssDir: 'css',
        jsDir: 'js',
        htmlDir: 'web/html',
        ...config
    }))
    // Allow config to posses top level promises that will be resolved
    .then((config) => Promise.all(Object.entries(config)
        .map(([key, val]) => {
            // if any root objects are promises, wait for them
            if (util.types.isPromise(val)) {
                return Promise.resolve(val).then((val) => ([key, val]))
            } else {
                return [key, val];
            }
        })
    ))
    .then((arr) => arr.reduce((acc, [key, val]) => {
        if (typeof key === 'string') {
            acc[key] = val;
        }
        return acc
    }, {}))
    .then((config) => {
        // @ts-ignore
        if (typeof config.name === 'string') {
            // @ts-ignore
            process.title = `${config.name}-build`;
        }
        return config;
    })
// .then((debug) => {
//     // @ts-ignore
//     console.log(`!!! config.foo = ${debug.foo}`);
//     return debug;
// });

export default config;