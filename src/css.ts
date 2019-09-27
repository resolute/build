import util from 'util';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import sass from 'node-sass';
import { each, hash } from './util';

const sassRender = util.promisify(sass.render);

const css = ([config, svg]) => each('*.scss', { cwd: config.build.cssDir, ignore: ['_*.scss'] },
    ({ file, content, base }) => sassRender({
        data: content.toString(),
        includePaths: [base],
        outputStyle: 'compressed',
        functions: {
            'inline-svg($file, $fill:"")': (rawFile, rawFill, done) => {
                const file = rawFile.getValue();
                const fill = rawFill.getValue();
                if (!svg.get(file)) {
                    throw new Error(file + ' not found in svg object.');
                }
                if (!file) {
                    throw new Error('No SVG file specified');
                }
                done(new sass.types.String(
                    fill === '' ?
                        svg.get(file).urlEncoded :
                        svg.get(file).urlEncoded.replace(/'%23[0-9A-Fa-f]{3,6}/g,
                            "'%23" + fill.replace(/^#/, ''))
                ));
            }
        }
    })
        // @ts-ignore
        .catch(sass.logError)
        // @ts-ignore
        .then(({ css }) => postcss([autoprefixer({ overrideBrowserslist: ['last 2 versions'] })])
            .process(css, { from: undefined }))
        .then(({ css }) => css.replace(/\n/g, '')) // remove any left over newlines
        .then((css) => hash(file, css, 'css', `${config.build.webDir}/css`, config.build.inline.test(file)))
).then(arr => arr.reduce((acc, i) => ({ ...acc, ...i }), {})); // array of objects to single object

export default css;