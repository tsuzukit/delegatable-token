const assert = require('assert');
const ganache = require('ganache-cli');
require('dotenv').config();
const Web3 = require('Web3');
const provider = ganache.provider({
  "debug": true
});
const web3 = new Web3(provider);

const MetaTransactionClient = require('../lib/metaTransactionClient');
const MetaTransactionServer = require('../lib/metaTransactionServer');

const compiledCustomToken = require('../contracts/build/CustomToken');

const initialSupply              = "1000000000000000000000"; // specified in minimum unit
const initialChargeToUserAccount = "100000000000000000000"; // specified in minimum unit
const tokenName = "TestToken";
const tokenSymbol = "TT";
const tokenDecimals = 18;

let accounts;
let customToken;
let txToServer;

before( async () => {
  accounts = await web3.eth.getAccounts();

  customToken = await new web3.eth.Contract(JSON.parse(compiledCustomToken.interface))
    .deploy({
      data: compiledCustomToken.bytecode,
      arguments: [initialSupply, tokenName, tokenSymbol, tokenDecimals]
    })
    .send({
      from: accounts[0],
      gas: '2000000'
    });
  customToken.setProvider(provider);

  await customToken.methods.addToWhitelist(process.env.SERVER_ACCOUNT_ADDRESS).send({
    from: accounts[0]
  });

  await customToken.methods.transfer(process.env.CLIENT_ACCOUNT_ADDRESS, initialChargeToUserAccount).send({
    from: accounts[0]
  });

  await web3.eth.sendTransaction({
    to: process.env.SERVER_ACCOUNT_ADDRESS,
    from: accounts[1],
    value: web3.utils.toWei('1', "ether"),
    gas: '1000000'
  });

});

describe('Delegatable custom token', () => {

  it('deploys contracts', async () => {
    assert.ok(customToken.options.address);
  });

  it('sets server account as delegated account for transfer on behalf of user', async () => {
    let isServerAccountDelegated = await customToken.methods.whitelist(process.env.SERVER_ACCOUNT_ADDRESS).call();
    assert.equal(true, isServerAccountDelegated);
    let isClientAccountDelegated = await customToken.methods.whitelist(process.env.CLIENT_ACCOUNT_ADDRESS).call();
    assert.equal(false, isClientAccountDelegated);
  });

  it('charged server account and client account has no ether', async () => {
    let balanceAtServer = await web3.eth.getBalance(process.env.SERVER_ACCOUNT_ADDRESS);
    assert.equal(web3.utils.toWei('1', 'ether'), balanceAtServer);
    let balanceAtClient = await web3.eth.getBalance(process.env.CLIENT_ACCOUNT_ADDRESS);
    assert.equal("0", balanceAtClient);
  });

  it('initializes token holdings', async () => {
    let tokenAtOwner = await customToken.methods.balanceOf(accounts[0]).call();
    assert.equal("900000000000000000000", tokenAtOwner);
    let tokenAtServer = await customToken.methods.balanceOf(process.env.SERVER_ACCOUNT_ADDRESS).call();
    assert.equal("0", tokenAtServer);
    let tokenAtClient = await customToken.methods.balanceOf(process.env.CLIENT_ACCOUNT_ADDRESS).call();
    assert.equal("100000000000000000000", tokenAtClient);
  });

  it('can sign tranxsaction at client', async () => {

    // fetch nonce of sender address tracked at TxRelay
    let nonce = await customToken.methods.nonce(process.env.CLIENT_ACCOUNT_ADDRESS).call();
    let amount = 20000000000000000000; // decimal

    txToServer = await MetaTransactionClient.createTransferTx(
      customToken.options.address,
      process.env.CLIENT_ACCOUNT_ADDRESS,
      process.env.CLIENT_ACCOUNT_PRIVATE_KEY,
      nonce,
      process.env.SERVER_ACCOUNT_ADDRESS,
      amount
    );

  });

  it('can sign tranxsaction at server', async () => {

    // fetch nonce of sender address
    let nonce = await web3.eth.getTransactionCount(process.env.SERVER_ACCOUNT_ADDRESS);

    let signedTxToRelay = await MetaTransactionServer.createRawTxToRelay(
      JSON.parse(compiledCustomToken.interface),
      txToServer.sig,
      txToServer.data,
      {
        "gas": 2000000,
        "gasPrice": 2000000,
        "gasLimit": 2000000,
        "value": 0,
        "to": customToken.options.address,
        "nonce": parseInt(nonce), // nonce of address which signs tx at server
        "from": process.env.SERVER_ACCOUNT_ADDRESS
      },
      process.env.SERVER_ACCOUNT_PRIVATE_KEY
    );

    await web3.eth.sendSignedTransaction('0x' + signedTxToRelay);

    let tokenAtOwner = await customToken.methods.balanceOf(accounts[0]).call();
    assert.equal("900000000000000000000", tokenAtOwner);
    let tokenAtServer = await customToken.methods.balanceOf(process.env.SERVER_ACCOUNT_ADDRESS).call();
    assert.equal("20000000000000000000", tokenAtServer);
    let tokenAtClient = await customToken.methods.balanceOf(process.env.CLIENT_ACCOUNT_ADDRESS).call();
    assert.equal("80000000000000000000", tokenAtClient);

  });

  it('does not allow sending token if signer is different from sender', async () => {

    // fetch nonce of sender address tracked at TxRelay
    let clientNonce = await customToken.methods.nonce(process.env.SERVER_ACCOUNT_ADDRESS).call();
    let amount = 20000000000000000000; // decimal

    // try creating tx that order client address to send token to server address
    txToServer = await MetaTransactionClient.createTransferTx(
      customToken.options.address,
      process.env.CLIENT_ACCOUNT_ADDRESS,
      process.env.SERVER_ACCOUNT_PRIVATE_KEY,
      clientNonce,
      process.env.SERVER_ACCOUNT_ADDRESS,
      amount
    );

    // fetch nonce of sender address
    let serverNonce = await web3.eth.getTransactionCount(process.env.SERVER_ACCOUNT_ADDRESS);

    let signedTxToRelay = await MetaTransactionServer.createRawTxToRelay(
      JSON.parse(compiledCustomToken.interface),
      txToServer.sig,
      txToServer.data,
      {
        "gas": 2000000,
        "gasPrice": 2000000,
        "gasLimit": 2000000,
        "value": 0,
        "to": customToken.options.address,
        "nonce": parseInt(serverNonce), // nonce of address which signs tx at server
        "from": process.env.SERVER_ACCOUNT_ADDRESS
      },
      process.env.SERVER_ACCOUNT_PRIVATE_KEY
    );

    try {
      let result = await web3.eth.sendSignedTransaction('0x' + signedTxToRelay);
      console.log(result);
      assert(false);
    } catch (err) {
      assert(true);
    }

    // amount of token should not be change from previous test case
    let tokenAtOwner = await customToken.methods.balanceOf(accounts[0]).call();
    assert.equal("900000000000000000000", tokenAtOwner);
    let tokenAtServer = await customToken.methods.balanceOf(process.env.SERVER_ACCOUNT_ADDRESS).call();
    assert.equal("20000000000000000000", tokenAtServer);
    let tokenAtClient = await customToken.methods.balanceOf(process.env.CLIENT_ACCOUNT_ADDRESS).call();
    assert.equal("80000000000000000000", tokenAtClient);

  });

});