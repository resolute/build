import fs from 'fs';
import util from 'util';
import glob from 'fast-glob';
import { unique } from './util';

const unlink = util.promisify(fs.unlink);

const clean = ([config, assets]) => {
    const preserve: string[] = [];
    const regex = /^(.*?[._-])([0-9a-f]{6})(\.(?:js|css))$/;
    const patterns = Object.values(assets as string)
        .map(path => path.match(regex))
        .filter(truey => !!truey)
        // @ts-ignore
        .map(([, prefix, hash, suffix]) => {
            preserve.push(hash);
            return prefix + '*' + suffix;
        })
        .filter(unique);
    // TODO: we _could_ simply return Promise.resolve(assets) and let this run async
    return glob(patterns, { cwd: config.webDir })
        .then(files => Promise.all(files
            // remove any of the just generated hash matches
            .filter(file => preserve.indexOf((file.match(regex) || [])[2]) === -1)
            // hydrate array of files with modified time stat
            .map(file => unlink(`${config.webDir}/${file}`))
        ))
        .then(() => assets);
};

export default clean;