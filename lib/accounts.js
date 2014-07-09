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
      if (err2) {callback(err2);}
      account.transactions = transactions;
      callback(null, account);
    });
  });
};

// starting_balance defaults to 0
// type defaults to CHECKING. Other values include: BUDGET.
exports.newAccount = function (db, params, callback) {
  var accounts = db.collection('accounts');
  accounts.ensureIndex({name: 1}, {unique: true}, function (err) {
    if (err) {callback(err); return;}

    var account = {
      name: params.name,
      starting_balance: (params.starting_balance) ? +params.starting_balance : 0,
      type: params.type || 'CHECKING'
    };

    // add default period length to a week
    if (account.type === 'BUDGET') {
      account.period_length = 7;
      account.period_budget = 0;
    }

    accounts.insert(account, {w: 1}, function (err2, result) {
      if (err2) {callback(err2); return;}
      callback(null, {account: result});
    });
  });
};

// currently only support adding categories to account
exports.updateAccount = function (db, params, callback) {
  var accounts = db.collection('accounts');

  accounts.findOne({name: params.name}, function (err, account) {
    if (err) {callback(err); return;}
    var categories = (params.categories !== '' && params.categories[0] === '[' && params.categories[-1] === ']') ? JSON.parse(params.categories) : [],
      starting_balance = params.starting_balance || account.starting_balance,
      type = params.type || account.type,
      period_length = (account.type === 'BUDGET') ? params.period_length : undefined,
      period_budget = (account.type === 'BUDGET') ? params.period_budget : undefined;

    accounts.update({name: params.name}, {
      $addToSet: {
        categories: {$each: categories}
      },
      $set: {
        starting_balance: starting_balance,
        type: type,
        period_length: period_length,
        period_budget: period_budget
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
};
