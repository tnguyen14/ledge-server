'use strict';

var DB = require('../db'),
    moment = require('moment-timezone'),
    _ = require('lodash'),
    ObjectId = require('mongod').ObjectId;

var objectIdError = new Error('ObjectId is not valid');

exports.showAll = function (params) {
  return DB.collection(params.name).find().sort({date: 1});
};

exports.newTransaction = function (params) {
  if (!params.amount) {
    throw new Error('Cannot add a transaction without amount.');
  }
  var amount = +params.amount,
      date = (params.date) ? new Date(params.date) : new Date(),
      desc = params.description,
      merchant = params.merchant,
      status = params.status || 'POSTED',
      cat = params.category || 'Default';

  date = moment.tz(date, 'America/New_York').toDate();

  return DB.collection(params.name).insert({
    amount: amount,
    date: date,
    description: desc,
    merchant: merchant,
    status: status,
    category: cat
  });
};

exports.updateTransaction = function (params) {
  var transactionId;
  if (!ObjectId.isValid(params._id)) {
    throw objectIdError
  }

  transactionId = new ObjectId(params._id);
  if (params.date) {
    params.date = moment.tz(new Date(params.date), 'America/New_York').toDate();
  }
  if (params.amount) {
    params.amount = +params.amount;
  }

  var account = DB.collection(params.name);
  return account.findOne({_id: transactionId}).then(function (transaction) {
    // only update specified properties
    var updatedTransaction = _.extend(transaction, _.pick(params, ['amount', 'date', 'description', 'merchant', 'status', 'category']));
    return account.update({_id: transactionId}, {$set: updatedTransaction});
  });
};

exports.deleteTransaction = function (params) {
  if (!ObjectId.isValid(params._id)) {
    throw objectIdError
  }
  return DB.collection(params.name).remove({_id: new ObjectId(params._id)});
};
