import { PathLike } from 'fs';

const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const glob = require('fast-glob');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

export const mkdirp = (path: PathLike) => mkdir(path, { recursive: true });

export const each = (pattern, opts, fn = (arg) => arg) => {
  const callback = typeof opts === 'function' ? opts : fn;
  const base = opts && opts.cwd && opts.cwd.replace(/\/$/, '');
  return glob(pattern, opts).then((files) => Promise.all(files.map((file) =>
    readFile(base ? `${base}/${file}` : file.toString())
      .then((content) => ({ file, content, base }))
      .then(callback))));
};

export const hash = (file, buffer, ext, dir: string, inline = false, sep = '.') => {
  const basename = file.replace(/\.[^.]+$/, '');
  const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0, 6);
  const hashPath = `${basename + sep + hash}.${ext}`;
  const asset = {};
  if (inline) {
    // eslint-disable-next-line no-new-wrappers
    asset[`${basename}.${ext}`] = new String(buffer);
    asset[`${basename}.${ext}`].inline = true;
  } else {
    asset[`${basename}.${ext}`] = `${ext}/${hashPath}`;
  }
  if (!inline) {
    return mkdirp(dir)
      .then(() => writeFile(`${dir}/${hashPath}`, buffer))
      .then(() => asset);
  }
  return Promise.resolve(asset);
};

export const unique = (val, index, arr) => arr.indexOf(val) === index;
export const flatten = (acc, val) => acc.concat(val);


declare const require: any;
export const deleteRequireCache = (regex: RegExp) => {
  Object.keys(require.cache).forEach((id) => {
    if (regex.test(id)) {
      console.log('deleting cache for module:', id);
      delete require.cache[id];
    }
  });
};
