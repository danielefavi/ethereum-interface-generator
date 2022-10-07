import fs from 'fs';

/**
 * The AbiHelper is a collection of functions used in the process of the loading
 * the compiled smart contract information from the JSON files provided through
 * the command line.
 */
export default class AbiHelper {

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