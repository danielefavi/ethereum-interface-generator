// ethExp is going to store the instance of the class EthereumExplorer
window.ethExp = null;

// the var contractDetailsJson is going to contain the ABI of the smart contracts.
// The placeholder below < % contract-details-json % > is going to be replace on runtime.
// Please check the function CliController@buildUI
const contractDetailsJson = <% contract-details-json %>;

// Once the page is loaded then it executes the init function to initialize all 
// the elements in the interface (like web3, EthereumExplorer, blockchain status connection, ...).
window.addEventListener('load', async () => await init());

// when the content of the field user-wallet-address changes then it is going to update
// the span element "user-wallet"
document.getElementById('user-wallet-address').addEventListener('input', e => {
    UI.setInnerHtml('user-wallet', e.target.value);
});

/**
 * Initialize the objects and UI for interacting with the blockchain.
 */
async function init() {
    // init the EthereumExplorer instance
    window.ethExp = new EthereumExplorer;

    // setting the messages in the UI to show the attempt to connect with the blockchain
    UI.setInnerHtml('status', 'connecting...');
    UI.console('connecting...');

    try {
        // initializing the Web3.js object
        await window.ethExp.bootWeb3();

        // if the Web3.js object is initialized then it means that we are connected
        UI.setInnerHtml('status', 'connected');
        UI.console('connected');

        // showing on the UI some general information
        UI.setInnerHtml('user-wallet', await window.ethExp.getUserAccount());
        UI.setInnerHtml('network-id', await window.ethExp.getNetworkId());
        UI.setInnerHtml('gas-limit', await window.ethExp.getGasLimit());
        UI.setInnerHtml('gas-price', await window.ethExp.getGasPrice());

        // loading the ABI of the smart contracts into the EthereumExplorer object.
        await bootContracts(contractDetailsJson);

        initUi();
    } catch (error) {
        UI.setInnerHtml('status', 'error');
        UI.consoleError('ERROR: ' + error.message);
        throw error;
    }
}

/**
 * Load the smart contract details (ABI and contract's address) on the EthereumExplorer object.
 * The object contractDetails is created on runtime and it has the following structure:
 * [
 *      {
 *          contractName: contract1,
 *          abi: { ... },
 *          networks: 0x...,
 *      }, {
 *          contractName: contract2,
 *          abi: { ... },
 *          networks: 0x...,
 *      }
 * ]
 * Please check out the function AbiLoader@getAbiFromFolder
 *
 * @param   {Array}  contractDetails  The details of the contract (like ABI, contract name and network).
 */
async function bootContracts(contractDetails) {
    // getting the current network ID of the blockchain we are connected to
    const netId = await window.ethExp.getNetworkId();

    // iterating through all the smart contracts
    for (let key in contractDetails) {
        // if the contract does not have a network ID on the current blockchain network we are connected to
        // then it means the contracts have not been published on the current blockchain network.
        if (! contractDetails[key].networks[netId]) {
            UI.consoleError(`ERROR: the network ID ${netId} does not exist for the contract ${contractDetails[key].contractName}. Probably you have to change network.`);
            continue;
        }

        // loading the contract into the the EthereumExplorer object
        await window.ethExp.loadContact(
            contractDetails[key].networks[netId].address, 
            contractDetails[key].abi, 
            contractDetails[key].contractName
        );
    }
}

/**
 * Initialize the UI: messages and interface for each smart contract loaded into
 * the EthereumExplorer object.
 */
function initUi() {
    // the EthereumExplorer global object must be initialized
    if (! window.ethExp) throw 'The Blockchain explorer is not initialized!';

    // generating the HTML code: adding a tab element for each smart contract
    let i = 0;
    for (let key in window.ethExp.contractDetails) {
        addContractToDashboard(window.ethExp.contractDetails[key], i++ == 0);
    }

    // Each smart contract's  tab in the UI has a select with the list of all the smart contract
    // functions (the box named "Select a function"). The for below appends an event to each entries
    // of the select to show the smart contract's function form the user selected
    for (let key in window.ethExp.contractDetails) {
        document.getElementById('smFunctions-' + key).addEventListener('change', e => {
            UI.hideElementsByClass('sm-fnc-panel-' + key); // hiding all the other smart contract's function form
            UI.showElement(e.target.value); // showing only the smart contract's form the user selected
        });
    }

    // initializing the blockchain events to show on the console
    initEvents();
    
    // initializing the bootstrap CSS elements on the tab navigator (otherwise when you click on a
    // tab element it wont work).
    UI.initBootstrapTabs();

    // showing the dashboard main element only when everything has been initialized
    UI.showElement('dashboard');
}

/**
 * Get the current user wallet address: it can be inserted manually in the field
 * "user-wallet-address" or taken automatically.
 *
 * @return  {string}    The user's wallet.
 */
async function getUserAddress() {
    var userAddress = document.getElementById('user-wallet-address').value;

    if (userAddress && userAddress.length) return userAddress;

    return  await window.ethExp.getUserAccount();
}

/**
 * Get the wallet's private key inserted in the field "user-private-key".
 *
 * @return  {string}
 */
function getUserPrivateKey() {
    var userPrivateKey = document.getElementById('user-private-key').value;

    if (userPrivateKey && userPrivateKey.length) return userPrivateKey;

    return null;
}

/**
 * Showing all the blockchain events into the console.
 */
function initEvents() {
    for (let contractName in window.ethExp.contractDetails) {
        window.ethExp.contract(contractName).events.allEvents({
            fromBlock: 0
        }, function(error, event) { 
            UI.eventsConsoleError(event);
        })
        .on("connected", function(subscriptionId){
            UI.eventsConsoleSuccess({ on:'connected', subscriptionId });
        })
        .on('data', function(event){
            UI.eventsConsole({ on:'data', event }); // same results as the optional callback above
        })
        .on('changed', function(event){
            UI.eventsConsole({ on:'changed', event });
        })
        .on('error', function(error, receipt) {
            // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            if (receipt) {
                UI.eventsConsoleError({ on:'error', receipt, error });
            } else {
                UI.eventsConsoleError({ on:'error', error});
            }
        });
    }
}

/**
 * Handle the call to a smart contract function submitted in a form.
 * @TODO refactor this function.
 * 
 * @param   {Object}  e     The event object when the form is submitted.
 */
async function handleSmartContractCall(e) { 
    e.preventDefault();

    // getting the data coming from the submitted form
    const data = new FormData(e.target);
    var options = {};
    const contractName = data.get('contract-name'); // name of the smart contract
    const scFnc = data.get('function-name');  // name of the smart contract's function

    var params = []; // is going to store all the parameters required from the smart contract's function

    for (const [name, val] of data) {
        if (! name.includes('input[')) continue;
        params.push(val);
    }

    // adding the eventual tx_value for payable smart contract methods
    if (data.has('tx_value')) {
        var val = data.get('tx_value');
        if (val && val.length && !isNaN(val)) options.value = parseInt(val);
    }

    try {
        UI.consoleHtml(`Calling the smart contract function: <b>${scFnc}</b>`);

        var userAddress = await getUserAddress(); // getting the user address (from the field or from the default user wallet)
        var userPrivateKey = getUserPrivateKey(); // getting the eventual private key from the input field of the UI

        // calling a function that is PURE or VIEW
        if (window.ethExp.methodIsViewOrPure(scFnc, contractName)) {
            // NOTE: msg.sender is 0x0 on the VIEW methods. The client must set
            // {from: userAddress} when calling the smart contract
            var res = await window.ethExp.call(scFnc, params, contractName, {from: userAddress});
            UI.consoleSuccess(res);
        } 
        // calling a function that is NON PAYABLE
        else if (window.ethExp.methodIsNonPayable(scFnc, contractName)) {
            (await window.ethExp.sendTxToSmartContract(userAddress, userPrivateKey, scFnc, params, options, contractName))
                .on('transactionHash', transactionHash => UI.consoleSuccess({ transactionHash }))
                .on('receipt', receipt => UI.consoleSuccess({ receipt }))
                .on('error', error => {
                    UI.consoleError('Error occurred: ' + error.message);
                    console.log(error);
                });
        } 
        // calling a function that is PAYABLE
        else if (window.ethExp.methodIsPayable(scFnc, contractName)) {
            (await window.ethExp.sendTxToSmartContract(userAddress, userPrivateKey, scFnc, params, options, contractName))
                .on('transactionHash', transactionHash => UI.consoleSuccess({ transactionHash }))
                .on('receipt', receipt => UI.consoleSuccess({ receipt }))
                .on('error', error => {
                    UI.consoleError('Error occurred: ' + error.message);
                    console.log(error);
                });
        }
        // Throwing an error in case of the state mutability is not fund
        else {
            throw new Error('The stateMutability of the smart contract function ' + scFnc + ' is not defined.');
        }
    } catch (error) {
        if (error.message.includes('invalid arrayify value')) {
            var message = 'probably you input a wrong type as parameter.' + '<br>ERROR DETAIL:' + error.message;
        } else {
            var message = error.message;
        }

        UI.consoleError('Error Occurred: ' + message);
        console.log(error);
    }
}

/**
 * Add dynamically the HTML for showing the tabs of each smart contract:
 * - In the HTML element "contracts-tab-nav" it adds a tab with the name of the smart contract.
 * - In the HTML element "contracts-tab-content" it adds the content of the tab (which is a dynamic
 *   select with the list of the smart contract's functions).
 *
 * @param   {Object}   contract      The smart contract details and ABI.
 * @param   {boolean}  active        Whether the tab should be active or not.
 */
function addContractToDashboard(contract, active=false) {
    const cName = contract.contractName;

    // adding a tab HTML element with the name of the smart contract
    document.getElementById('contracts-tab-nav').innerHTML += `
        <li class="nav-item">
            <a class="nav-link ${active ? 'active' : ''} smart-contract-tab" data-bs-toggle="tab" href="#contract-tab-${cName}">${cName}</a>
        </li>
    `;

    // creating the content of the tab: the content is split in 2 columns:
    //  - In the left column there is a select with the list of the function related to the selected smart contract.
    //  - In the right column (smContractPanels-${cName}) it will appear the form of the selected smart contract function.
    document.getElementById('contracts-tab-content').innerHTML += `
        <div class="tab-pane p-4 fade ${active ? 'active show' : ''} smart-contract-content" id="contract-tab-${cName}">
            <h3 class="pb-3"><b>${cName}</b> smart contract</h3>
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">Select a function</div>
                        <div class="card-body p-0">
                            <select name="smFunctions-${cName}" id="smFunctions-${cName}" size="10" class="form-select"></select>
                        </div>
                    </div>
                </div>

                <div class="col-md-8" id="smContractPanels-${cName}"></div>
            </div>
        </div>
    `;

    // add dynamically a form for each smart contract function found in the contract's ABI
    for (let abiItem of contract.abi) {
        if (abiItem.type == 'function') addFncToDashboard(cName, abiItem);
    }
}

/**
 * Add dynamically a form into the tab content (please check the function "addContractToDashboard") 
 * to call a specific smart contract function.
 *
 * @param   {string}  contractName      The name of the smart contract.
 * @param   {Object}  abiItem           Smart contract's ABI.
 */
function addFncToDashboard(contractName, abiItem) {
    var formId = 'sm_' + contractName + '_' + abiItem.name;

    // adding an option element into the select created in "addContractToDashboard"
    // The option element has as value the Form ID and as label the function name
    var opt = document.createElement('option');
    opt.value = formId; // value of the select's option
    opt.innerHTML = abiItem.name; // label of the select's option
    // adding the option to the select
    document.getElementById('smFunctions-' + contractName).appendChild(opt);

    const div = document.createElement('div');

    // creating the HTML for showing the form with all the fields required to interact with the 
    // specific smart contract function (abiItem.name)
    var html = `
        <form method="POST" id="${formId}" class="sm-fnc-panel-${contractName}" style="display:none">
            <input type="hidden" name="contract-name" value="${contractName}" />
            <input type="hidden" name="function-name" value="${abiItem.name}" />
            <div class="card mb-3">
                <div class="card-header">
                    <b>${abiItem.name}</b>
                </div>
                <div class="card-body">
                    <div class="row">`;
                        var i = 0;

                        // adding an input field for each input of the smart contract function found in the ABI specification
                        for (let input of abiItem.inputs) {
                            html += `
                                <div class="mb-3">
                                    <label for="formFileSm" class="form-label">${input.name} / ${input.type}</label>
                                    <input type="text" name="input[${i++}]" class="form-control form-control-sm">
                                </div>
                            `;
                        }

                        // if the smart contract's function is payable then it adds an extra field to send funds to the smart contract.
                        if (window.ethExp.methodIsPayable(abiItem.name, contractName) || window.ethExp.methodIsNonPayable(abiItem.name, contractName)) {
                            html += `
                                <hr>
                                <div class="mb-3">
                                    <label for="formFileSm" class="form-label">Value</label>
                                    <input type="text" name="tx_value" class="form-control form-control-sm">
                                </div>
                            `;
                        }

                        html += `
                    </div>
                </div>
                <div class="card-footer">
                    <button type="submit" class="btn btn-danger btn-sm">Execute</button>
                </div>
            </div>
        </form>
    `;

    // adding the HTML of the form just created to the smart contract tab (right column)
    div.insertAdjacentHTML('beforeend', html);
    document.getElementById('smContractPanels-' + contractName).appendChild(div);

    // appending the event on submit on the form just created
    // @TODO added the setTimeout because the event was not appended to the formId element. Find a nicer way.
    setTimeout(() => document.getElementById(formId).addEventListener('submit', handleSmartContractCall), 200);
}

/* ************************************************************************** */
/* ***********************       UTILITY CLASSES       ********************** */
/* ************************************************************************** */

/**
 * Utility class for manipulating the interface.
 */
class UI {

    /**
     * Set the HTML of the element ID with the given content. 
     *
     * @param   {string}         elementId     The ID of the HTML element.
     * @param   {string|Object}  content       The content should be set to the element.
     */
    static setInnerHtml(elementId, content) {
        if (typeof content == 'object') content = JSON.stringify(content, null, '    ');

        document.getElementById(elementId).innerHTML = content;
    }

    /**
     * Append the given content to the given HTML element ID.
     *
     * @param   {string}         elementId     The ID of the HTML element.
     * @param   {string|Object}  content       The content should be set to the element.
     */
    static appendInnerHtml(elementId, content) {
        if (typeof content == 'object') content = JSON.stringify(content, null, '    ');

        document.getElementById(elementId).innerHTML += '<br>' + content;
    }

    /**
     * Show an element by setting the "display" CSS property to "block".
     *
     * @param   {string}    elementId     The ID of the HTML element.
     * @param   {[type]}    displayProp   The property to set to the "display" CSS attribute (default "block").
     */
    static showElement(elementId, displayProp='block') {
        document.getElementById(elementId).style.display = displayProp;
    }

    /**
     * Hide an element by setting the "display" CSS property to "none".
     *
     * @param   {string}    elementId     The ID of the HTML element.
     * @param   {string}    displayProp   The property to set to the "display" CSS attribute (default "none").
     */
    static hideElement(elemId, displayProp='none') {
        document.getElementById(elemId).style.display = displayProp;
    }

    /**
     * Hide all elements having the given CSS class as parameter.
     *
     * @param   {[type]}  className    CSS class of the elements to hide.
     * @param   {[type]}  displayProp  The property to set to the "display" CSS attribute (default "none").
     */
    static hideElementsByClass(className, displayProp='none') {
        for (let el of document.getElementsByClassName(className)) {
            el.style.display = displayProp;
        }
    }

    /**
     * Show an error on the UI's console styled as error.
     * This function is used to show blockchain events.
     *
     * @param   {string|Object}     message   The message to show.
     */
    static eventsConsoleError(message) {
        UI.eventsConsole(message, { isError: true });
    }

    /**
     * Show an HTML message to the UI's console.
     * This function is used to show blockchain events.
     *
     * @param   {string|Object}     message   The message to show.
     */
    static eventsConsoleHtml(message) {
        UI.eventsConsole(message, { htmlSanitize: false });
    }

    /**
     * Show a success message on the UI's console styled as success.
     * This function is used to show blockchain events.
     *
     * @param   {string|Object}     message   The message to show.
     */
    static eventsConsoleSuccess(message) {
        UI.eventsConsole(message, { isSuccess: true });
    }

    /**
     * Display a blockchain event to the UI's console.
     * This function is a wrapper around the "console" function.
     *
     * @param   {string|Object}     message   The message to show.
     * @param   {Object}            options   Eventual options for displaying the message (like isError, isSuccess, snitize HTML, ...).
     */
    static eventsConsole(message, options={}) {
        UI.console(message, options, 'events-console');
    }

    /**
     * Show an error on the UI's console.
     * This function is a wrapper around the "console" function.
     *
     * @param   {string|Object}     message   The message to show.
     */
    static consoleError(message) {
        UI.console(message, { isError: true });
    }

    /**
     * Show a message in the UI's console without sanitizing the given message.
     * This function is a wrapper around the "console" function.
     *
     * @param   {string|Object}     message   The message to show.
     */
    static consoleHtml(message) {
        UI.console(message, { htmlSanitize: false });
    }

    /**
     * Show a success message in the UI's console.
     * This function is a wrapper around the "console" function.
     *
     * @param   {string|Object}     message   The message to show.
     */
    static consoleSuccess(message) {
        UI.console(message, { isSuccess: true });
    }

    /**
     * Append a message into the UI console HTML element.
     *
     * @param   {string|Object}     message   The message to show.
     * @param   {Object}            options   Eventual options for displaying the message (like isError, isSuccess, snitize HTML, ...).
     * @param   {string}            elemId    The ID of the HTML element.
     */
    static console(message, options={}, elemId='console') {
        var consoleElem = document.getElementById(elemId);

        // transforming the message into JSON string if it is an object
        if (typeof message == 'object') message = JSON.stringify(message, null, '    ');

        // appending the timestamp in front of the message
        message = (new Date().toISOString()) + ': ' + message;

        // appending eventual classes to style the message
        var classes = '';
        if (options.isError) classes = 'text-danger';
        else if (options.isSuccess) classes = 'text-success';

        // sanitizing the message (default = true)
        if (typeof options.htmlSanitize == 'undefined') options.htmlSanitize = true;
        if (options.htmlSanitize) {
            message = message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        // appending the message HTML into the console element
        consoleElem.innerHTML += `<p class="m-0 pt-0 pb-2 ${classes}">${message}</p>`;

        // scrolling the console to the bottom to show the last message
        consoleElem.scrollTop = consoleElem.scrollHeight;
    }

    /**
     * Initialize the events on the CSS bootstrap tab elements so when the user 
     * clicks on a tab then the related tab content is shown.
     * Note that the page imports only the bootstrap CSS and not the bootstrap JS.
     */
    static initBootstrapTabs() {
        document.querySelectorAll('.nav-tabs a.nav-link').forEach(el => {
            el.addEventListener('click', event => {
                let navTabs = event.target.parentNode.parentNode;
                
                navTabs.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
                event.target.classList.add('active');

                Array.from(navTabs.nextElementSibling.children).forEach(el => {
                    el.classList.remove('active');
                    el.classList.remove('show');
                });

                let target = document.querySelector(event.target.getAttribute('href'));
                if (target) {
                    target.classList.add('active');
                    target.classList.add('show');
                }
            });
        });
    }
}

/**
 * Utility class to make easier the interaction with the Ethereum blockchain.
 */
class EthereumExplorer {
    
    /**
     * Constructor: initialize the default values of the class attributes.
     */
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.contractDetails = {};
        this.defaultOptions = {
            gasLimit: null,
            gasPrice: null,
        };
        this.userAccount = null;
        this.callbacks = {};
    }

    /**
     * Initialize Web3.js
     */
    async bootWeb3() {
        var web3Provider = null;

        // Modern dapp browsers...
        if (window.ethereum) {
            web3Provider = window.ethereum;

            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
            } catch (error) {
                // User denied account access...
                throw error;
            }
        } else if (window.web3) {
            // Legacy dapp browsers...
            web3Provider = window.web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        this.web3 = new Web3(web3Provider);
    }

    /**
     * Load into the EthereumExplorer object all the details of a smart contract.
     * The details needed are the compiled details of the smart contract (like ABI).
     *
     * @param   {Object}  contractJson  The details of the contract to load.
     * @param   {string}  contractName  The name of the contract.
     */
    async loadContractFromJson(contractJson, contractName='default') {
        var netId = await this.getNetworkId();
        
        if (! contractJson.networks[netId]) {
            throw 'The network ID does not exist in the JSON of the contract. Probably you have to change network. Current network: ' + netId;
        }

        this.loadContact(contractJson.networks[netId].address, contractJson.abi, contractName);
    }

    /**
     * Store the contract details in the class "contractDetails" attribute and
     * then store the contract object from web3/eth into the attribute "contracts"
     * for an easy picking of the contract object.
     *
     * @param   {string}  contractAddress  Address of the contract.
     * @param   {Object}  contractAbi      The ABI of the contract.
     * @param   {string}  contractName     The name of the contract, useful if you deal with more than one smart contract.
     */
    loadContact(contractAddress, contractAbi, contractName='default') {
        this.contractDetails[contractName] = {};
        this.contractDetails[contractName].address = contractAddress;
        this.contractDetails[contractName].abi = contractAbi;
        this.contractDetails[contractName].contractName = contractName;

        this.contracts[contractName] = new this.web3.eth.Contract(contractAbi, contractAddress);
    }

    /**
     * Return the web/eth contract instance loaded in the function "loadContact".
     *
     * @param   {string}  contractName      The name of the contract.
     */
    contract(contractName='default') {
        return this.contracts[contractName];
    }

    /**
     * Return the contract details loaded in the function "loadContact".
     *
     * @param   {string}  contractName      The name of the contract.
     */
    contractDetail(contractName='default') {
        return this.contractDetails[contractName];
    }

    /**
     * Call a smart contract function.
     *
     * @param   {string}  method        The name of the smart contract function to call.
     * @param   {mixed}   param         The parameters to pass to the smart contract function we are calling.
     * @param   {string}  contractName  The name of the smart contract.
     * @param   {Object}  options       Extra options for calling the smart contract method (please reference to the Web3.js documentation).
     */
    async call(method, param, contractName='default', options={}) {
        if (param === null) {
            return this.contracts[contractName].methods[method]().call(options);
        }
        
        if (typeof param == 'object') {
            return this.contracts[contractName].methods[method](...param).call(options);
        }

        return this.contracts[contractName].methods[method](param).call(options);
    }

    /**
     * Get the network ID of the blockchain we are connected to.
     *
     * @return  {Integer}    The ID of the blockchain network.
     */
    async getNetworkId() {
        return await this.web3.eth.net.getId(); 
    }

    /**
     * Check if a smart contract method is pure, view, payable, non payable, ...
     *
     * @param   {string}  type          The type of the method to check (pure, view, payable, ...).
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  contractName  The name of the smart contract.
     * @return  {boolean|null}
     */
    methodTypeIs(type, method, contractName='default') {
        if (this.contractDetail(contractName) && this.contractDetail(contractName).abi) {
            const fnc = this.contractDetail(contractName).abi.filter(item => item.name == method);
            if (! fnc.length) return null;

            return (fnc[0].stateMutability && fnc[0].stateMutability == type);
        }

        return null;
    }

    /**
     * Check if the smart contract method is pure.
     *
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  method        The name of the method to call.
     * @return  {boolean|null}
     */
    methodIsViewOrPure(method, contractName='default') {
        return (this.methodTypeIs('view', method, contractName) || this.methodTypeIs('pure', method, contractName));
    }

    /**
     * Check if the smart contract method is payable.
     *
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  method        The name of the method to call.
     * @return  {boolean|null}
     */
    methodIsPayable(method, contractName='default') {
        return this.methodTypeIs('payable', method, contractName);
    }

    /**
     * Check if the smart contract method is non payable.
     *
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  method        The name of the method to call.
     * @return  {boolean|null}
     */
    methodIsNonPayable(method, contractName='default') {
        return this.methodTypeIs('nonpayable', method, contractName);
    }

    /**
     * Submit a transaction to the smart contract.
     *
     * @param   {string}            fromAddress     The address of the user's wallet.
     * @param   {string|null}       fromPrivateKey  The private key of the user's wallet/
     * @param   {string}            contractFnc     The name of the function of the smart contract we are calling.
     * @param   {Array}             contractData    Extra data to sent along with the smart contract call.
     * @param   {[type]}            options         Extra option needed for calling the smart contract (for example when the method is payable then you might need to send funds to the smart contract).
     * @param   {[type]}            contractName    The name of the smart contract.
     *
     * @return  {Object}            Return the transaction promise.
     */
    async sendTxToSmartContract(fromAddress, fromPrivateKey, contractFnc, contractData=[], options={}, contractName='default') {
        // checking if the contract has been loaded
        if (! this.contractDetail(contractName)) {
            throw 'Contract address not found!';
        }

        // getting the transaction raw data
        var txData = await this.getTransactionData(
            fromAddress,
            this.contractDetail(contractName).address,
            options
        );

        // checking if there is a fund to send to the smart contract
        if (options.value) txData.value = options.value;

        // if the private key is given then we must sign the transaction with that private key
        if (fromPrivateKey) {
            const data = this.contract(contractName).methods[contractFnc](...contractData).encodeABI();
            if (data) txData.data = data;

            // signing the transaction with the given private key
            const signedTx = await this.web3.eth.accounts.signTransaction(txData, fromPrivateKey);

            // DOCS: https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html?highlight=sendSignedTransaction#id90
            this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', transactionHash => this.emit('transactionHash', transactionHash))
                .on('receipt', receipt => this.emit('receipt', receipt))
                .on('error', error => this.emit('error', error));
            
            return Promise.resolve(this);
        }

        // if the private key is not given then teh signature will be handled via Metamask (or similar)
        this.contract(contractName).methods[contractFnc](...contractData).send(txData)
            .on('transactionHash', transactionHash => this.emit('transactionHash', transactionHash))
            .on('receipt', receipt => this.emit('receipt', receipt))
            .on('error', error => this.emit('error', error));

        return Promise.resolve(this);
    }

    /**
     * Get the basic transaction data.
     *
     * @param   {string}  from     The users's wallet address.
     * @param   {string}  to       The destination address.
     * @param   {Object}  options  The eventual default options.
     *
     * @return  {Object}           The transaction data.
     */
    async getTransactionData(from, to, options={}) {
        return { from, to, 
            nonce: options.nonce || await this.web3.eth.getTransactionCount(from, 'pending'),
            gasPrice: options.gasPrice || await this.getGasPrice(false),
            gasLimit: options.gasLimit || await this.getGasLimit(false),
        }
    }

    /**
     * Get the current gas limit.
     *
     * @param   {string}   fromCache    Load the gas limit from the class attribute.
     *
     * @return  {Number|null}           The gas limit.
     */
    async getGasLimit(fromCache=true) {
        if (this.defaultOptions.gasLimit && fromCache) return this.defaultOptions.gasLimit;

        const block = await this.getBlock('latest');

        if (block) {
            this.defaultOptions.gasLimit = block.gasLimit;
            return this.defaultOptions.gasLimit;
        }
        
        return null;
    }

    /**
     * Get the current gas price.
     *
     * @param   {string}   fromCache    Load the gas price from the class attribute.
     *
     * @return  {Number|null}           The gas price.
     */
    async getGasPrice(fromCache=true) {
        if (this.defaultOptions.gasPrice && fromCache) return this.defaultOptions.gasPrice;

        const gasPrice = this.web3.eth.getGasPrice();

        if (gasPrice) {
            this.defaultOptions.gasPrice = gasPrice;
            return gasPrice;
        }
        
        return null;
    }

    /**
     * Get the block details of the given block number.
     *
     * @param   {Integer}  blockNumber  The number of the block to retrieve.
     *
     * @return  {Object}                The details of the block.
     */
    async getBlock(blockNumber) {
        return await this.web3.eth.getBlock(blockNumber);
    }

    /**
     * Return the number of the latest block minded.
     *
     * @return  {Integer}   The number of the latest block.
     */
    async getBlockNumber() {
        return await this.web3.eth.getBlockNumber();
    }

    /**
     * Get the user account from the Metamask (or any other clients manager).
     *
     * @return  {string}  The user's wallet address.
     */
    async getUserAccount() {
        if (this.userAccount) return this.userAccount;

        const accounts = await this.web3.eth.getAccounts();

        this.userAccount = accounts[0];

        return this.userAccount;
    }

    /**
     * Append a callback to a given event.
     *
     * @param   {string}  eventName    The name of the event.
     * @param   {function}  callback   The callback function to attach to the event.
     *
     * @return  {EthereumExplorer}
     */
     on(eventName, callback) {
        if (! this.callbacks[eventName]) {
            this.callbacks[eventName] = callback;
        }

        return this;
    }

    /**
     * Emit an event.
     *
     * @param   {string}  eventName  The name of the event.
     * @param   {mixed}  data        The data to attach to the event
     *
     * @return  {mixed}
     */
    emit(eventName, data) {
        if (this.callbacks[eventName]) {
            return this.callbacks[eventName](data);
        }
    }

}