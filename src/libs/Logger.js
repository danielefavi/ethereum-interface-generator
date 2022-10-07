const ERROR_COLOR   = '\x1b[31m%s\x1b[0m'; // red
const WARNING_COLOR = '\x1b[33m%s\x1b[0m'; // yellow
const INFO_COLOR    = '\x1b[36m%s\x1b[0m'; // cyan
const SUCCESS_COLOR = '\x1b[32m%s\x1b[0m'; // green

/**
 * Class for showing messages on the console.
 */
export default class Logger {

    log(message, ...params) {
        console.log('\n' + message + '\n', ...params);
    }

    error(message, ...params) {
        console.error(ERROR_COLOR, '\n' + message + '\n', ...params);
    }

    fatalError(message, ...params) {
        this.error('\nERROR: ' + message + '\n', ...params);
        process.exit();
    }

    warn(message, ...params) {
        console.warn(WARNING_COLOR, '\n' + message + '\n', ...params);
    }

    info(message, ...params) {
        console.info(INFO_COLOR, '\n' + message + '\n', ...params);
    }

    success(message, ...params) {
        console.info(SUCCESS_COLOR, '\n' + message + '\n', ...params);
    }

}