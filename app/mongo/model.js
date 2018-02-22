let mongoose = require('mongoose');
let Schema = mongoose.Schema;
require('dotenv').config();

const mongoDatabase = process.env.MONGO_DATABASE;
const endpoint = 'mongodb://mongo/' + mongoDatabase;

let Contract = new Schema({
  name: String,
  address: String,
  methods: [String]
});

let Account = new Schema({
  id: String,
  password: String,
  address: String,
  privateKey: String
});

db = mongoose.connect(endpoint);

exports.Contract = mongoose.model('Contract', Contract);
exports.Account = mongoose.model('Account', Account);
exports.db = db;
