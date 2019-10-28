import { each } from './util';

const Svgo = require('svgo');

const svg = ([config]) => each('**/*.svg', { cwd: config.build.svgDir }, ({ file, content }): Promise<[string, {
  raw: string;
  urlEncoded: string;
}]> => new Svgo({
  // datauri: 'unenc', // our regex escaping is better than encodeURIComponent()
  plugins: [
    { cleanupIDs: false },
    { removeTitle: true },
    { sortAttrs: true },
    { convertTransform: false },
    { removeDimensions: true },
  ],
})
  .optimize(content)
  .then((res) => [
    file.toString(),
    {
      raw: res.data,
      urlEncoded: `url("data:image/svg+xml,${
        res.data.replace(/["%&#{}<>|]/g, (i) => ({
          '"': '\'',
          '%': '%25',
          '&': '%26',
          '#': '%23',
          '{': '%7B',
          '}': '%7D',
          '<': '%3C',
          '>': '%3E',
          '|': '%7C',
        }[i]))
      }")`,
    },
  ]))
  // @ts-ignore
  .then((all) => new Map(all));

export default svg;
