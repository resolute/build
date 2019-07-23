import fs from 'fs';
import util from 'util';
import Juice from 'juice';
import htmlmin from 'htmlmin';

const juice = util.promisify(Juice.juiceFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const email = ([config, tpl, assets]) => Promise.all(tpl
    .filter(({ file }) => /\/email\//.test(file))
    .map(({ file, template }) => new Promise((resolve, reject) => {
        const dest = file.replace(/marko$/, 'html');
        const tmp = file.replace(/marko$/, 'tmp.html');
        const output = fs.createWriteStream(tmp);
        template.render({ ...config, ...assets }, output
            .on('close', () =>
                juice(tmp, { webResources: { images: false } })
                    .then(html => writeFile(dest, htmlmin(html)))
                    .then(() => unlink(tmp))
                    .then(() => unlink(file + '.js'))
                    .then(resolve)
                    .catch(reject)
            )
            .on('error', reject));
    })));

export default email;