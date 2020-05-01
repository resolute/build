import { mkdirp } from './util';

const fs = require('fs');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

const html = ([config, tpl, assets, svg]) => Promise.all(tpl)
  .then((tpl) => Promise.all(tpl
    // @ts-ignore
    .filter(({ file }) => !/components/.test(file) && config.build.html.test(file))
    .map(({ file, template }) => {
      const outputFilename = `${config.build.htmlDir}/${
        file
          .replace(new RegExp(`^${config.build.tplDir}`), '')
          .replace(/\.marko$/, '.html')}`;
      const deepdirs = outputFilename.match(/^(.+)\/.+?$/);
      return (deepdirs ?
        mkdirp(deepdirs[1]) :
        Promise.resolve()
      )
        .then(() =>
          writeFile(outputFilename,
            template.render({ ...config, ...assets, svg }).getOutput()));
    })));

export default html;
