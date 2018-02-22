const Transaction = require('./transaction');

class MetaTransactionServer  {

  /**
   * Create encoded method call and sign transaction
   * @param abi
   * @param sig
   * @param data
   * @param wrapperTx
   * @param privateKey
   * @returns {Promise<*>}
   */
  static async createRawTxToRelay(abi, sig, data, wrapperTx, privateKey) {

    return Transaction.createTx(abi, "transferDelegate",
      [ sig.v,
        Transaction.add0x(sig.r.toString('hex')),
        Transaction.add0x(sig.s.toString('hex')),
        Transaction.add0x(data)
      ], wrapperTx, privateKey);
  };

}

module.exports = MetaTransactionServer;

