let model = require('../mongo/model');
let Contract = model.Contract;

let get = async (req, res, next) => {

  Contract.find({})
    .exec(function(err, result) {
      if (err) {
        res.send(err);
      }
      res.send(result);
    });

};

exports.get = get;