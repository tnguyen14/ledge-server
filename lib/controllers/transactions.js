'use strict';

var DB = require('../db'),
  moment = require('moment-timezone'),
  _ = require('lodash'),
  ObjectId = require('mongod').ObjectId;

exports.showAll = function (params) {
  return DB.collection(params.name).find().sort({date: 1});
};

exports.showOne = function (params) {
  return DB.collection(params.name).findOne({_id: new ObjectId(params._id)});
};

exports.newTransaction = function (params) {
  if (!params.amount) {
    throw new Error('Cannot add a transaction without amount.');
  }
  var amount = +params.amount,
    time = (params.time) ? params.time : '08:00', // default to 08:00 AM
    date = (params.date) ? new Date(params.date + ' ' + time) : new Date(),
    desc = params.description,
    merchant = params.merchant,
    source = params.source,
    status = params.status || 'POSTED',
    cat = params.category || 'default';

  date = moment.tz(date, 'America/New_York').toDate();

  return DB.collection(params.name).insert({
    amount: amount,
    date: date,
    description: desc,
    merchant: merchant,
    status: status,
    category: cat,
    source: source
  });
};

exports.updateTransaction = function (params) {
  var transactionId = new ObjectId(params._id);
  if (params.date) {
    params.date = moment.tz(new Date(params.date + ' ' + (params.time || '08:00')), 'America/New_York').toDate();
  }
  if (params.amount) {
    params.amount = +params.amount;
  }

  var account = DB.collection(params.name);
  return account.findOne({_id: transactionId}, {_id: 0}).then(function (transaction) {
    // only update specified properties
    var updatedTransaction = _.extend(transaction, _.pick(params, [
      'amount',
      'date',
      'description',
      'merchant',
      'status',
      'category',
      'source'
    ]));
    return account.update({_id: transactionId}, {$set: updatedTransaction});
  });
};

exports.deleteTransaction = function (params) {
  return DB.collection(params.name).remove({_id: new ObjectId(params._id)});
};
