import CliController from "./controllers/CliController.js";
import { Command } from 'commander';
const program = new Command();

// setting the general information for the HELP
program
    .name('ethereum-interface-generator')
    .description('Smart contract interface generator for Ethereum')
    .version('1.0.0');

// defining the SERVE command
program.command('serve')
    .description('Build the UI and start the server')
    .option('-c, --contracts <directory>', 'Folder that contains the built smart contracts.', '.')
    .option('-p, --port <port>', 'Port of the server. EG: http://localhost:5432', '5432')
    .action(args => (new CliController).serve(args));

// defining the EXPORT command
program.command('export')
    .description('Build the UI and export to the target folder')
    .option('-c, --contracts <directory>', 'Folder that contains the built smart contracts.', '.')
    .option('-t, --target <directory>', 'Destination folder where to export the UI', '.')
    .option('-m, --minify', 'Minify the Javascript', false)
    .action(args => (new CliController).export(args));

program.parse();