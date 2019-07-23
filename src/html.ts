import fs from 'fs';
import util from 'util';
import { mkdirp } from './util';

const writeFile = util.promisify(fs.writeFile);

const html = ([config, tpl, assets, svg]) => Promise.all(tpl)
    .then((tpl) => Promise.all(tpl
        // @ts-ignore
        .filter(({ file }) => !/components/.test(file) && config.html.test(file))
        .map(({ file, template }) => {
            const outputFilename = config.htmlDir + '/' +
                file
                    .replace(new RegExp('^' + config.tplDir), '')
                    .replace(/\.marko$/, '.html');
            const deepdirs = outputFilename.match(/^(.+)\/.+?$/);
            return (deepdirs ?
                mkdirp(deepdirs[1]) :
                Promise.resolve()
            )
                .then(() =>
                    writeFile(outputFilename,
                        template.render({ ...config, ...assets, svg })))
        })));

export default html;