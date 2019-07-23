import glob from 'fast-glob';
import markoHotReload from 'marko/hot-reload';
import markoNodeRequire from 'marko/node-require';

// Node.js can require() `.marko` files
markoNodeRequire.install();
markoHotReload.enable({ silent: true });

const tpl = ([config]) => glob(config.tplDir + '/**/*.marko')
    .then(files => files.map(file => {
        markoHotReload.handleFileModified(`${process.cwd()}/${file}`, { silent: true });
        const template = require(`${process.cwd()}/${file}`);
        return { file, template };
        // return import(`${process.cwd()}/${file}`)
        //     .then((template) => ({ file, template }));
    }));

export default tpl;