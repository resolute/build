#!/usr/bin/env node

import { unique } from './util';

import _config from './config';
import _svg from './svg';
import _js from './js';
import _css from './css';
import _assets from './assets';
import _clean from './clean';
import _tpl from './tpl';
import _html from './html';
import _email from './email';
import _node from './node';
import _watch from './watch';

interface CacheableFunction extends Function {
  cache?: Promise<any>;
}
interface CachedFunction extends Function {
  invalidate: Function;
}

const timer = async (fn: Function, ...args): Promise<any> => {
  const starttime = process.hrtime();
  const result = await fn.call(undefined, ...args);
  const [seconds, nanoseconds] = process.hrtime(starttime);
  // eslint-disable-next-line no-console
  console.log(`${fn.name}: %s ms`, (seconds * 1000 + nanoseconds / 1e6)
    .toLocaleString(undefined, { maximumFractionDigits: 0 }));
  return result;
};

const cacheify = (fn: CacheableFunction): CachedFunction => {
  const cachedFunction = (...dependencies: Function[]) => {
    if (!fn.cache) {
      // eslint-disable-next-line no-param-reassign
      fn.cache = timer(fn, ...dependencies);
    }
    return fn.cache;
  };
  cachedFunction.invalidate = () => {
    console.log(`invalidate: ${fn.name}`);
    // eslint-disable-next-line no-param-reassign
    fn.cache = undefined;
  };
  return cachedFunction;
};

const config = cacheify(_config);
const svg = cacheify(_svg);
const js = cacheify(_js);
const css = cacheify(_css);
const assets = cacheify(_assets);
const clean = cacheify(_clean);
const tpl = cacheify(_tpl);
const html = cacheify(_html);
const email = cacheify(_email);
const node = cacheify(_node);

const Dependencies = new Map<CacheableFunction, CacheableFunction[]>([
  [config, []],
  [svg, [config]],
  [js, [config]],
  [css, [config, svg]],
  [assets, [config, js, css]],
  [clean, [config, assets]],
  [tpl, [config]],
  [html, [config, tpl, assets, svg]],
  [email, [config, tpl]],
  [node, [config, tpl, assets, email]],
]);

const InvalidationPatterns = [
  // [config, /etc\/config\.[tj]s$/],
  [config, /config\.[tj]s$/],
  [svg, /\.svg$/],
  [css, /\.scss$/],
  [js, /^(?:lib|etc|js)\/.+?\.[tj]s$/],
  [node, /^(?:lib|etc|app)\/.+?\.[tj]s$/],
  [tpl, /\.marko$/],
  [email, /^tpl\/email\/.+?\.(?:marko|css)$/],
];

// console.log('\nDependencies:');
// for (const [key, fns] of Dependencies) {
//     console.log(key.name + ': [' + fns.map(fn => fn.name).join(', ') + ']');
// }
// console.log('\n\nReverseDependencies:');
// for (const [key, fns] of ReverseDependencies) {
//     console.log(key.name + ': [' + fns.map(fn => fn.name).join(', ') + ']');
// }
// console.log('\n\n');
// process.exit();


const up = (fn: CacheableFunction) => {
  const deps = Dependencies.get(fn) || [];
  if (deps.length === 0) {
    return fn.call(undefined);
  }
  return Promise.all(deps.map(up))
    .then((...deps) => fn.call(undefined, ...deps));
};

const build = (fns = Dependencies.keys()) => {
  const build = () => Promise.all(Array.from(fns).map(up));
  return timer(build);
};


const watch = cacheify(_watch(Dependencies, InvalidationPatterns, build));
Dependencies.set(watch, [config]);
// (async () => {
//     console.log('Build 1');
//     await build();
//     console.log('Manually invalidating css');
//     css.invalidate();
//     console.log('Build 2');
//     await build();
// })()
build();
// .then(() => {
//     watch();
// });
