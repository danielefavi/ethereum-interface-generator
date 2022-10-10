Ethereum Smart Contracts Interface Generator
============================================

NPM command that generates an interface from ABIs to interact with the **Ethereum smart contracts**.

> **IMPORTANT: this package is still under development!**

The generated interface is easily customizable: the GUI is built with **bootstrap** and **vanilla javascript** (and of course Web3.js 🙂).

With this NPM command you can export the interface or run the interface automatically on the server.

<p align="center"><img src="https://raw.githubusercontent.com/danielefavi/ethereum-interface-generator/main/.github/images/exported-ui-sample.png" width="60%" height="70%" /></p>

---

# Installation

```sh
npm i ethereum-interface-generator -g
```

# Commands

## Serve

The `serve` command creates the interface for interacting with the smart contract and it starts the server to the default URL `http://localhost:5432`.

**Usage:**

```sh
eth-ui-gen serve
```

**Options**:

- `-c` (or `--contracts`): folder that contains the compiled ABI of the smart contracts. Default: current folder (`.`);
- `-p` (or `--port`): port of the local server. Default: 5432


Note: if you run `eth-ui-gen serve` without specifying `-c` then make sure you run the command in the same folder where the ABIs are stored (on Truffle the folder is `build/contracts`).

The command below builds the interface using the ABIs found in the folder `/../dapp/build/contracts/` and then it starts the local server on the port 7765.

```sh
eth-ui-gen serve -c /../dapp/build/contracts/ -p 7765
```

## Export

```sh
eth-ui-gen export
```

**Options**:

- `-c` (or `--contracts`): folder that contains the compiled ABI of the smart contracts. Default: current folder (`.`);
- `-t` (or `--target`): destination folder where to export the files. Default: current folder (`.`).
- `-m` (or `--minify`): minify the Javascript. Default: `false`.

Note: if you run `eth-ui-gen export` without specifying `-c` then make sure you run the command in the same folder where the ABIs are stored (on Truffle the folder is `build/contracts`).

The command below builds the UI using the smart contract ABIs found in the folder `/../dapp/build/contracts/` and it exports the files to the folder `/home/dan/Desktop/smart-contracts-ui/`.

```sh
eth-ui-gen export -c /../dapp/build/contracts/ -t /home/dan/Desktop/smart-contracts-ui/
```

## Smart Contract JSON Format

The JSON files of the **compiled** and **deployed** smart contracts (that you give to the command) must contain the following values:

- `contractName`: the name of the contract.
- `abi`: ABI of the compiled smart contract. 
- `networks`: list of networks where the contract has been deployed.

Below an example of how the JSON file should look like:

```json
{
    "contractName": "MyAwesomeContract",
    "abi": [
        {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "storeName",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
        },

        ...

    ],
    "networks": {
        "4747": {
            "events": {},
            "links": {},
            "address": "0xba607E0A4eED20239C4f2237688e660da8262e3E",
            "transactionHash": "0x9bc44b20869b2ed0bf62788da9fe65fe847a5cf37225bc5e442c4d4319e10f29"
        }
    }
```

# More information

Please find more info at [https://www.danielefavi.com/blog/ethereum-smart-contracts-gui-generator/](https://www.danielefavi.com/blog/ethereum-smart-contracts-gui-generator/)

---

## The GUI explained

<p align="center"><img src="https://raw.githubusercontent.com/danielefavi/ethereum-interface-generator/main/.github/images/ethereum-gui-generator-walk-through.png" width="100%" /></p>