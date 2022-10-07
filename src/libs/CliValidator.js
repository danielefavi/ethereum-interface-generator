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
     * Check if the JSON of the compiled smart contract output has the required
     * values.
     * 
     * @param {Object} json 
     * @return {boolean}
     */
     validateJsonAbiFormat(json) {
        if (
            typeof json != 'object' ||
            typeof json.contractName == 'undefined' ||
            typeof json.abi == 'undefined' ||
            typeof json.networks != 'object'
        ) {
            return false;
        }

        for (let netId in json.networks) {
            // the network ID must have only digits
            if (! /^\d+$/.test(netId)) return false;

            // checking the address is valid: string 42 chars long, starting with 0x and 
            // having 0-9 and a-f afterward
            if (typeof json.networks[netId].address != 'string') return false;
            if (! /^(0x)?[0-9a-fA-F]{40}$/.test(json.networks[netId].address)) return false;
        }

        return true;
    }

}