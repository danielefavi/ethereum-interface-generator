import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

/**
 * This class has functions for interacting with the file system (like creating
 * directories, creating files, ...).
 */
export default class FsHelper {

    static createTempDir(prefix='eth_ui_gen_') {
        return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    }

    /**
     * Create a directory if it does not exist.
     *
     * @param   {string}  directory   The directory to be created.
     */
    static createDirectory(directory) {
        fs.mkdirSync(directory, { recursive: true });
    }

    /**
     * Delete the given file.
     *
     * @param   {string}  filePath      Path of the file to delete.
     */
    static deleteFile(filePath) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            if (!e.code || (e.code && e.code != 'ENOENT')) throw e;
        }
    }

    /**
     * Copy a file from the source to the target.
     *
     * @param   {string}  source    Name of the file to copy from.
     * @param   {string}  target    Name of the destination (path and filename).
     */
    static copyFile(source, target) {
        fs.copyFileSync(path.resolve(this.dirname(), source), target);
    }

    /**
     * Write a file.
     *
     * @param   {string}  target   Filepath of the file.
     * @param   {string}  content  Content of the file.
     */
    static writeFile(target, content) {
        fs.writeFile(target, content, 'utf8', err => { 
            if (err) throw err;
        });
    }

    /**
     * Return the absolute path.
     *
     * @param   {string}  dirPath   Relative path
     * @return  {string}            The absolute path.
     */
    static pathResolve(dirPath) {
        return path.resolve(this.dirname(), dirPath);
    }

    /**
     * Return the path of the filename where the script has been executed.
     *
     * @return  {string}
     */
    static filename() {
        return fileURLToPath(import.meta.url);
    }

    /**
     * Return the path of the directory where the script has been executed.
     *
     * @return  {string}
     */
    static dirname() {
        return path.dirname(this.filename());
    }

}