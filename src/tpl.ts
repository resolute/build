const glob = require('fast-glob');
const markoHotReload = require('marko/hot-reload');
const markoNodeRequire = require('marko/node-require');

// Node.js can require() `.marko` files
markoNodeRequire.install();
markoHotReload.enable({ silent: true });

const tpl = ([config]) => glob(`${config.build.tplDir}/**/*.marko`)
  .then((files) => files.map((file) => {
    markoHotReload.handleFileModified(`${process.cwd()}/${file}`, { silent: true });
    // eslint-disable-next-line
    const template = require(`${process.cwd()}/${file}`);
    return { file, template };
    // return import(`${process.cwd()}/${file}`)
    //     .then((template) => ({ file, template }));
  }));

export default tpl;
