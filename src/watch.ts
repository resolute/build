import sane, { Watcher } from 'sane';
import { unique, flatten } from './util';

let watcher: Watcher;

/**
 * debounce: Returns a function, that, as long as it continues to be
 * invoked (.), will not be triggered (*).  The function will be called
 * after it stops being called for `threshold` milliseconds.  If
 * `immediate` is passed, trigger the function on the leading edge,
 * instead of the trailing.
 *
 *       /-- 10s --\ /-- 10s --\ /-- 10s --\
 *     (*). . . . . . . . . . . .           *
 *
 * @param   function    fn          Function to be throttled
 * @param   number      threshold   Milliseconds fn will be throttled
 *
 * @return  function    Debounce'd function `fn`
 */

const debounceAndAggregate = (fn: Function, threshold?: number) => {

    let timeout;
    let aggregateArgs: any[] = [];

    return (...args: any) => {
        console.log(' +/-: ' + args[0]);
        aggregateArgs.push(args);

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            timeout = null;
            fn.call(undefined, aggregateArgs);
            aggregateArgs = [];
        }, threshold);

    }
};


interface CachedFunction extends Function {
    invalidate: Function;
}


const watch = (Dependencies, InvalidationPatterns, build) => {


    const watch = async ([config]) => {

        // TODO dynamic config

        if (process.argv.indexOf('watch') === -1) {
            return;
        }

        if (watcher) {
            watcher.close();
        }

        const reverseDepLookup = (search): CachedFunction[] => {
            let newList: CachedFunction[] = [];
            for (const [key, deps] of Dependencies) {
                if (deps.find(fn => fn === search)) {
                    newList = newList.concat([key]).concat(reverseDepLookup(key));
                }
            }
            return ([] as CachedFunction[]).concat(newList).filter(unique);
        };
        const ReverseDependencies = new Map(
            // Map([
            //  [assets, [tpl, html, email, node]],
            //  [tpl, [html, email, node]], …
            // ])
            Array.from(Dependencies.keys())
                .map(fn => [fn, reverseDepLookup(fn)])
        );

        const run = debounceAndAggregate((paths) => {
            // console.log('paths: ', paths)
            const invalidatedFunctions = paths
                .map(([path /* , root, stat */]) => path)
                .reduce(flatten, [])
                .filter(unique)
                .map((path) =>
                    InvalidationPatterns
                        .filter(([fn, pattern]) => pattern.test(path))
                        .map(([fn]) => fn)
                        .filter(unique)
                )
                .reduce(flatten, [])
                .filter(unique)
                .map((fn) => {
                    return [fn].concat(ReverseDependencies.get(fn));
                })
                .reduce(flatten, [])
                .filter(unique);

            if (invalidatedFunctions.length > 0) {
                // TODO make cancellable
                invalidatedFunctions.forEach((fn) => {
                    fn.invalidate();
                });
                build();
            } else {
                console.log('   =: no cached fns invalidated');
            }
        }, 16);

        watcher = sane(process.cwd(), { ignored: /node_modules/ })
            .on('change', run)
            .on('add', run)
            .on('delete', run)
            // .on('ready', () => { console.log('watching') });

    }

    return watch;
}

export default watch;