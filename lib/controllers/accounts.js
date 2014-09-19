'use strict';

var Promise = require('promise');

exports.showAll = function (db, params) {
  return new Promise(function (resolve, reject) {
    var accounts = db.collection('accounts');
    accounts.find().toArray(function (err, items) {
      if (err) {
        reject(err);
      }
      resolve({accounts: items});
    });
  });
};

exports.showAccount = function (db, params) {
  return new Promise(function (resolve, reject) {
    var accounts = db.collection('accounts');
    accounts.findOne({name: params.name}, function(err, account) {
      if (err) {
        reject(err);
      }
      // get the transactions
      var accountColl = db.collection(params.name);
      accountColl.find().toArray(function (err, transactions) {
        if (err) {
          reject(err);
        } else {
          account.transactions = transactions;
          resolve(account);
        }
      });
    });
  });
};

// starting_balance defaults to 0
// type defaults to CHECKING. Other values include: BUDGET.
exports.newAccount = function (db, params) {
  return new Promise(function (resolve, reject) {
    var accounts = db.collection('accounts');
    accounts.ensureIndex({name: 1}, {unique: true}, function (err) {
      if (err) {
        reject(err);
      }
      var account = {
        name: params.name,
        starting_balance: (params.starting_balance) ? +params.starting_balance : 0,
        type: params.type || 'BUDGET'
      };

      // add default period length to 4 weeks
      if (account.type === 'BUDGET') {
        account.period_length = 4;
        account.period_budget = 0;
      }

      accounts.insert(account, {w: 1}, function (err, result) {
        if (err) {reject(err);}
        resolve({account: result});
      });
    });
  });
};

// currently only support adding categories to account
exports.updateAccount = function (db, params) {
  return new Promise(function (resolve, reject) {
    var accounts = db.collection('accounts');
    accounts.findOne({name: params.name}, function (err, account) {
      if (err) {reject(err);}
      var categories = (params.categories !== '' && params.categories[0] === '[' && params.categories[-1] === ']') ? JSON.parse(params.categories) : [],
        updatedProperties = {
          starting_balance: (params.starting_balance) ? +params.starting_balance : account.starting_balance,
          type: params.type || account.type
        };
        if (account.type === 'BUDGET') {
          updatedProperties.period_length = params.period_length;
          updatedProperties.period_budget = params.period_budget;
        }

      accounts.update({name: params.name}, {
        $addToSet: {
          categories: {$each: categories}
        },
        $set: updatedProperties
      }, {w: 1}, function(err, result) {
        if (err) {reject(err2);}
        resolve({updated: result});
      });
    });
  });
};

exports.deleteAccount = function (db, params) {
  return new Promise(function (resolve, reject) {
    var accounts = db.collection('accounts');
    accounts.findOne({name: params.name}, function (err, result) {
      if (err) {reject(err);}
      if (!result) {
        reject(new Error('Unable to find account ' + params.name));
      }
      accounts.remove({name: params.name}, {w: 1}, function (err, result) {
        if (err) {reject(err);}
        // find and delete the account collection
        db.collection(params.name, {strict: true}, function (err, collection) {
          if (err) {reject(err);}
          collection.drop(function (err4, reply) {
            if (!err4) {
              resolve(reply);
            }
          });
        });
      });
    });
  });
};
