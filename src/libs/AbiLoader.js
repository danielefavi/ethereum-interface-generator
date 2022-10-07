import fs from 'fs';

/**
 * The AbiLoader class loads the essential information of the built smart contracts.
 * To the AbiLoader you can give it the path of the folder where are stored the
 * compiled smart contracts; it will return an array with all the ABIs.
 */
export default class AbiLoader {

    /**
     * Return the list of ABI of all smart contracts found in the given directory.
     *
     * @param   {string}  directory  The path of the directory containing the built smart contracts.
     *
     * @return  {array}              List of the smart contracts' ABIs.
     */
    getAbiFromFolder(directory) {
        if (! fs.existsSync(directory)) {
            throw new Error('The directory ' + directory + ' does not exist.');
        }

        var jsons = this.getJsonFromFolder(directory);

        var abi = [];
        
        for (var json of jsons) {
            if (this.validateJsonAbiFormat(json)) {
                abi.push({
                    contractName: json.contractName,
                    abi: json.abi,
                    networks: json.networks,
                });
            } else {
                throw new Error('The provided JSON is not valid.');
                // console.error('\x1b[31m%s\x1b[0m', 'The provided JSON is not valid.');
                // process.exit();
            }
        }
    
        return abi.sort((a,b) => this.sortByProperty(a, b, 'contractName'));
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

    /**
     * Store the data into a file.
     *
     * @param   {string}  filename  The path of the file where to store the data.
     * @param   {mixed}   data       The data to save.
     */
    extortToFile(filename, data) {
        fs.writeFile(filename, JSON.stringify(data, null, 4), 'utf8', function (err) {
            if (err) console.log(err);
        });
    }

    /**
     * Helper function to sort an array of object by the given property.
     *
     * @param   {Object}  a         First value to compare.
     * @param   {Object}  b         Second value to compare.
     * @param   {string}  property  Property of the object.
     *
     * @return  {int}
     */
    sortByProperty(a, b, property) {
        if (typeof a[property] == 'undefined' && typeof b[property] == 'undefined') return 0;
        if (typeof a[property] == 'undefined') return 1;
        if (typeof b[property] == 'undefined') return -1;

        let fa = a[property].toLowerCase();
        let fb = b[property].toLowerCase();
    
        if (fa < fb) return -1;
        if (fa > fb) return 1;
        return 0;
    }

    /**
     * Scan the given folder, looking for all JSON files. Then it returns all 
     * the JSONs parsed.
     *
     * @param   {string}  directory  The folder to scan.
     *
     * @return  {array}              List of all JSONs parsed.
     */
    getJsonFromFolder(directory) {
        var filesContent = this.getFilesContent(directory);

        return this.convertContentToJson(filesContent);
    }

    /**
     * Get all the content of the JSON files contained in the given folder.
     *
     * @param   {string}  directory  The name of the folder where to get the JSONs
     *
     * @return  {Array}              Array of the JSONs but not parsed.
     */
    getFilesContent(directory) {
        var filesContent = [];
    
        if (directory.charAt(-1) != '/' || directory.charAt(-1) != '\\') directory += '/';
    
        var files = fs.readdirSync(directory);

        files = files.filter(file => file.substring(file.length-5) == '.json');
        
        for (var fileName of files) {
            filesContent.push(fs.readFileSync(directory + fileName, 'utf8'));
        }
    
        return filesContent;
    }

    /**
     * Parse a list of strings into JSON.
     *
     * @param   {Array}  contents  Array of strings to JSON parse.
     *
     * @return  {Array}            The strings parsed into JSON.
     */
    convertContentToJson(contents) {
        var json = [];

        for (var content of contents) {
            try {
                json.push(JSON.parse(content));
            } catch (error) {
                continue;
            }
        }

        return json;
    }

}