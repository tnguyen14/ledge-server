'use strict';

var DB = require('../db');
var noAccount = new Error('No such account was found');

exports.showAll = function (params) {
  return DB.collection('accounts').find();
};

exports.showAccount = function (params) {
  return DB.collection('accounts').findOne({name: params.name}).then(function (account) {
    if (!account) {
      throw noAccount;
    }
    return DB.collection(params.name).find().sort({date: 1}).then(function (transactions) {
      account.transactions = transactions;
      return account;
    });
  });
};

// starting_balance defaults to 0
// type defaults to BUDGET. Other values include: CHECKING.
exports.newAccount = function (params) {
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
  return DB.collection('accounts').insert(account);
};

// currently only support adding categories to account
exports.updateAccount = function (params) {
  var accounts = DB.collection('accounts');
  return accounts.findOne({name: params.name}).then(function (account) {
    if (!account) {throw noAccount;}
    var categories = [];
    var updatedProperties = {
      starting_balance: (params.starting_balance) ? +params.starting_balance : account.starting_balance,
      type: params.type || account.type
    };
    if (params.categories && params.categories[0] === '[' && params.categories[-1] === ']') {
      categories = JSON.parse(params.categories);
    }
    if (account.type === 'BUDGET') {
      updatedProperties.period_length = params.period_length || account.period_length;
      updatedProperties.period_budget = params.period_budget || account.period_budget;
    }

    return accounts.update({name: params.name}, {
      $addToSet: {
        categories: {$each: categories}
      },
      $set: updatedProperties
    });
  });
};

exports.deleteAccount = function (params) {
  var accounts = DB.collection('accounts');
  return accounts.findOne({name: params.name}).then(function (account) {
    if (!account) {throw noAccount;}
    return accounts.remove({name: params.name}).then(function () {
      return DB.collection(params.name).drop();
    });
  });
};
