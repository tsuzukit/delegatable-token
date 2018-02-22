let model = require('../mongo/model');
require('dotenv').config();
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider(process.env.INFURA_ENDPOINT);
const web3 = new Web3(provider);
const crypt = require('../util/crypt');


let get = async (req, res, next) => {

  res.send({
    'status': 1
  });

};

let post = async (req, res, next) => {

  // TODO validation
  // make sure id and password is present
  // if data is present with id, return error
  let id = req.body.id;
  let password = req.body.password;

  let account = web3.eth.accounts.create();
  let balance = await web3.eth.getBalance(account.address);

  // TODO try catch error
  await new model.Account({
    id: id,
    password: crypt.encrypt(password),
    address: account.address,
    privateKey: crypt.encrypt(account.privateKey)
  }).save();

  res.send({
    'status': 1,
    'account': {
      'address': account.address,
      'balance': balance,
    }
  });

};

exports.post = post;
exports.get = get;
