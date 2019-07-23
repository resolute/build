import util from 'util';
import childProcess from 'child_process';

const exec = util.promisify(childProcess.exec);

const node = ([config]) => exec('pgrep -f pm2 && pm2 info ' + config.name +
    ' && pm2 reload ' + config.name + ' || echo pm2 not running this app');

export default node;