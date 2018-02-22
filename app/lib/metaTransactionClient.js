const util = require("ethereumjs-util");
const solsha3 = require('solidity-sha3').default;
const EthereumjsTx = require('ethereumjs-tx');
const Transaction = require('./transaction');

class MetaTransactionClient  {

  /**
   *
   * Create data which contains from, to and amount to transfer token
   * @param contractAddress
   * @param myAddress
   * @param myPrivateKey
   * @param nonce
   * @param to
   * @param amount
   * @returns {Promise<{sig: *, from: *, to: *, amount: *, data: *}>}
   */
  static createTransferTx(contractAddress, myAddress, myPrivateKey, nonce, to, amount) {
    let rawTx = util.stripHexPrefix(myAddress) + util.stripHexPrefix(to) + Transaction.pad(amount.toString(16));
    return this.createRawTxToRelay(
      rawTx,
      myPrivateKey,
      nonce,
      contractAddress
    );
  };

  /**
   * Create data that can be sent to server. sent data is then signed at server and thrown to network
   * @param transferTx
   * @param selfPrivateKey
   * @param nonce
   * @param tokenAddress
   * @returns {Promise<{sig: *, from: *, to: *, amount: *, data: *}>}
   */
  static async createRawTxToRelay(transferTx, selfPrivateKey, nonce, tokenAddress) {

    // Tight packing, as Solidity sha3 does
    let hashInput = '0x1900'
      + util.stripHexPrefix(tokenAddress)
      + Transaction.pad(nonce)
      + transferTx;

    let hash = solsha3(hashInput);
    let sig = MetaTransactionClient._signMsgHash(hash, selfPrivateKey);

    return {
      'sig': sig,
      'data': transferTx,
    };

  };

  /**
   *
   *  Private methods
   *
   */

  static _signMsgHash(msgHash, privateKey) {
    return util.ecsign(Buffer.from(util.stripHexPrefix(msgHash), 'hex'), Buffer.from(util.stripHexPrefix(privateKey), 'hex'));
  };

}

module.exports = MetaTransactionClient;

