const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const assets = ([config, js, css]) => readFile(`${config.build.etcDir}/assets.json`)
  .then((raw) => JSON.parse(raw.toString()))
  .then(async (assets) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, val] of Object.entries(assets)) {
      if (config.build.inline.test(key)) {
        // eslint-disable-next-line
        assets[key] = new String(val);
        // eslint-disable-next-line no-param-reassign
        assets[key].inline = true;
      }
    }
    return assets;
  })
  .catch(() => ({}))
  .then((assets) => ({
    ...assets,
    ...js,
    ...css,
  }))
  .then((assets) => writeFile(`${config.build.etcDir}/assets.json`, JSON.stringify(assets, null, 4))
    .then(() => assets)); // prevent double writing? TODO: investigate race condition

export default assets;
