import CliValidator from '../libs/CliValidator.js';
import child_process from 'child_process';
import fs from 'fs';
import FsHelper from '../libs/FsHelper.js';
import UglifyJS from 'uglify-js';

/**
 * This controller handles the requests coming from the Command Line Interface.
 */
export default class CliController {

    /**
     * Build the graphical interface to interact with the smart contracts and
     * then it starts the server.
     *
     * @param   {Object{}}  argv  Arguments coming from the command line.
     */
    serve(argv={}) {
        const validator = new CliValidator;

        const port = argv.port ? validator.validatePort(argv.port) : null; // the validation on the port is not done if the argument is not specified
        const abi = validator.validateAbiDir(argv.contracts || '.'); // the validation on the contract's directory is always sone

        const distTempDir = FsHelper.createTempDir().replace(/\/+$/, '');

        this.buildUiToFile(abi, distTempDir);

        var cmdArgs = ' -- --temp_dist_folder ' + distTempDir;
        if (port) {
            cmdArgs += ' --port ' + port;
        }

        this.runScript('npm run --prefix ' + FsHelper.dirname() + '/../../ start ' + cmdArgs);
    }

    /**
     * Build the graphical interface to interact with the smart contracts and
     * then it exports the interface to the destination folder.
     *
     * @param   {Object{}}  argv  Arguments coming from the command line.
     */
    export(argv={}) {
        const validator = new CliValidator;

        if (argv.target) {
            var targetDir = validator.validateDir(argv.target);
        } else {
            var targetDir = '.';
        }

        const abi = validator.validateAbiDir(argv.contracts || '.'); // the validation on the contract's directory is always sone

        if (targetDir.substring(targetDir.length-1) != '/' && targetDir.substring(targetDir.length-1) != '\\') {
            targetDir += '/';
        }

        this.copyAssetFilesToTargetDirectory(targetDir);

        FsHelper.writeFile(targetDir + 'index.html', this.buildUI(abi, argv.minify));

        console.info(`\nExported successfully to the folder "${targetDir}"\n`);
    }

    /**
     * Show the version of the package.
     */
    version() {
        const packageJson = JSON.parse(fs.readFileSync(FsHelper.dirname() + '/../../package.json', 'utf8'));

        console.info(packageJson.version);
    }

    /**
     * Build the UI: add in the template page the smart contracts' ABI.
     *
     * @param   {array}    abi      The smart contracts' ABI.
     * @param   {boolean}  minify   Minify or not the Javascript (default false).
     * @return  {string}
     */
    buildUI(abi, minify=false) {
        var script = fs.readFileSync(FsHelper.dirname() + '/../templates/main-script.js', 'utf8');
        const abiStr = JSON.stringify(abi, null, 4);
        script = script.replace('<% contract-details-json %>', abiStr);

        if (minify) {
            var result = UglifyJS.minify(script);
            if (result.error) {
                global.logger.fatalError('Error occurred on minifying the script: ' + result.error);
            }
            script = result.code;
        }

        var pageContent = fs.readFileSync(FsHelper.dirname() + '/../templates/index.html', 'utf8');
        return pageContent.replace('<% main-script %>', script);
    }

    /**
     * Create the HTML page content and write it into the index.html of the dist
     * folder.
     *
     * @param   {array}   abi       The smart contracts ABI.
     * @param   {string}  folder    The destination folder where to place the builded index.html
     */
    buildUiToFile(abi, folder='../../dist') {
        const pageContent = this.buildUI(abi);

        FsHelper.writeFile(FsHelper.pathResolve(folder.replace(/\/+$/, '') + '/index.html'), pageContent);
    }

    /**
     * Run a command console.
     *
     * @param   {string}  command   The command to run.
     * @param   {array}   args      Arguments to pass to the command.
     */
    runScript(command, args) {
        var child = child_process.spawn(command, args, {
            encoding: 'utf8',
            shell: true
        });
    
        child.on('error', error => console.error(error));
    
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', data => console.log(data.toString()));
    
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', data => console.log(data));
    
        child.on('close', (code) => {
            switch (code) {
                case 0:
                    console.log('End Process');
                    break;
            }
        });
    }

    /**
     * Copy all the target files (like web3.js and bootstrap.css) into the target
     * folder.
     *
     * @param   {string}  targetDir     The destination directory where the UI should be built to.
     */
    copyAssetFilesToTargetDirectory(targetDir) {
        FsHelper.createDirectory(targetDir + 'public');

        FsHelper.deleteFile(targetDir + 'public/bootstrap-5.0.2.min.css');
        FsHelper.deleteFile(targetDir + 'public/bootstrap-5.0.2.min.css.map');
        FsHelper.deleteFile(targetDir + 'public/web3-1.7.3.min.js');
        FsHelper.deleteFile(targetDir + 'public/web3-1.7.3.min.js.map');

        FsHelper.copyFile('../../public/bootstrap-5.0.2.min.css', targetDir + 'public/bootstrap-5.0.2.min.css');
        FsHelper.copyFile('../../public/bootstrap-5.0.2.min.css.map', targetDir + 'public/bootstrap-5.0.2.min.css.map');
        FsHelper.copyFile('../../public/web3-1.7.3.min.js', targetDir + 'public/web3-1.7.3.min.js');
        FsHelper.copyFile('../../public/web3-1.7.3.min.js.map', targetDir + 'public/web3-1.7.3.min.js.map');
    }

}

