import fs from 'fs';
import util from 'util';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const assets = ([config, js, css]) => readFile(`${config.etcDir}/assets.json`)
    .then(raw => JSON.parse(raw.toString()))
    .then(async (assets) => {
        for (const [key, val] of Object.entries(assets)) {
            if (config.inline.test(key)) {
                assets[key] = new String(val);
                assets[key].inline = true;
            }
        }
        return assets;
    })
    .catch(() => ({}))
    .then(assets => ({
        ...assets,
        ...js,
        ...css
    }))
    .then(assets => writeFile(`${config.etcDir}/assets.json`, JSON.stringify(assets, null, 4))
        .then(() => assets)); // prevent double writing? TODO: investigate race condition

export default assets;