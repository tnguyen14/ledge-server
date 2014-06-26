'use strict';

exports.showAll = function (db, params, callback) {
	var accounts = db.collection('accounts');
  accounts.find().toArray(function (err, items) {
    if (err) {callback(err); return;}
    callback(null, {accounts: items});
  });
};

exports.showAccount = function (db, params, callback) {
  var accounts = db.collection('accounts');
  accounts.findOne({name: params.name}, function(err, account) {
    if (err) {callback(err); return;}
    // get the transactions
    var accountColl = db.collection(params.name);
    accountColl.find().toArray(function (err2, transactions) {
      if (err2) {callback(err2)}
      account.transactions = transactions;
      callback(null, account);
    });
  });
};

exports.newAccount = function (db, params, callback) {
  var name = params.name,
    starting = +params.starting_balance;
  var accounts = db.collection('accounts');
  accounts.ensureIndex({name: 1}, {unique: true}, function (err, indexName) {
    if (err) {callback(err); return;}
    accounts.insert({name: name, starting_balance: starting}, {w: 1}, function (err2, result) {
      if (err2) {callback(err2); return;}
      callback(null, {account: result});
    });
  });
};

// currently only support adding categories to account
exports.updateAccount = function (db, params, callback) {
  var accounts = db.collection('accounts'),
    categories = JSON.parse(params.categories);
  accounts.findOne({name: params.name}, function (err, account) {
    if (err) {callback(err); return;}
    accounts.update({name: params.name}, {
      $addToSet: {
        categories: {$each: categories}
      }
    }, {w: 1}, function(err2, result) {
      if (err2) {callback(err2); return;}
      callback(null, {updated: result});
    });
  });
};

exports.deleteAccount = function (db, params, callback) {
  var accounts = db.collection('accounts');
  accounts.findOne({name: params.name}, function (err, result) {
    if (err) {callback(err); return;} 
    if (!result) {
      callback(new Error('Unable to find account ' + params.name));
      return;
    }
    accounts.remove({name: params.name}, {w: 1}, function (err2, result) {
      if (err2) {callback(err2); return;}
      // find and delete the account collection
      db.collection(params.name, {strict: true}, function (err3, collection) {
        if (!err3) {
          collection.drop(function (err4, reply) {
            if (!err4) {
              callback(null, reply);
            }
          });
        } else {
          callback(null, {message: 'OK!'});
        }
      });
    });
  });
}