import AbiLoader from './AbiLoader.js';
import fs from 'fs';

/**
 * Validate the data given as argument from the command line interface.
 */
export default class CliValidator {

    /**
     * Validate the port given from the CLI.
     *
     * @param   {string}  port      The port given from the CLI.
     * @return  {Integer}           The validated port.
     */
    validatePort(port) {
        if (!port || !port.length) global.logger.fatalError('The port is required.');
        
        if (! /^\d+$/.test(port)) {
            global.logger.fatalError('The port must be an integer greater than 0.');
        }

        return port;
    }

    /**
     * Validate the directory name and it checks if it exists.
     *
     * @param   {string}  path            The path of the directory to check.
     * @param   {string}  msgElement      Name of the directory to display in the error message.
     * @return  {string}                  The path of the directory validated.
     */
    validateDir(path, msgElement='directory name') {
        if (!path || !path.length) global.logger.fatalError(`The ${msgElement} is required.`);

        if (!fs.existsSync(path)) {
            global.logger.fatalError(`The folder "${path}" does not exist.`);
        }

        return path;
    }

    /**
     * Validates the directory containing the compiled ABI: if the directory path
     * is valid and the ABI are found in the given directory then it returns an
     * array with all the ABIs.
     *
     * @param   {string}  directory  The directory where to find the built smart contracts.
     *
     * @return  {Array}              List of all ABIs.
     */
    validateAbiDir(path) {
        this.validateDir(path);

        const abi = (new AbiLoader).getAbiFromFolder(path);

        if (! abi.length) {
            global.logger.fatalError(`No ABI found in the folder "${path}".`);
        }

        return abi;
    }

}