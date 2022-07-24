Ethereum Smart Contracts Interface Generator
============================================

NPM command that generate automatically an interface for interacting with the Ethereum smart contracts.

What you need is the smart contract ABI and the command will generate an interface.

The interface is made with **bootstrap** and **vanilla Javascript**.  
**The interface is easily customizable.**

With this NPM command you can export the interface or run automatically the interface in the server.

eth-ui-gen

node src/cli.js serve -c ../build/contracts
node src/cli.js export -c ../build/contracts -t ../piripoppi --minify