'use strict';

var moment = require('moment-timezone'),
    ObjectID = require('mongodb').ObjectID;

exports.showAll = function (db, params, callback) {
  var account = db.collection(params.name);
  account.find().toArray(function (err, items) {
    if (err) {callback(err); return;}
    callback(null, items);
  });
};

exports.newTransaction = function (db, params, callback) {
  if (!params.amount) {
    callback(new Error('Cannot add a transaction without amount.'));
    return;
  }
  var amount = params.amount,
      date = (params.date) ? new Date(params.date) : new Date(),
      desc = params.description,
      merchant = params.merchant,
      status = params.status || 'POSTED',
      cat = params.category || 'Default';

  var account = db.collection(params.name);
  date = moment.tz(date, 'America/New_York').toDate();

  account.insert({
    amount: amount,
    date: date,
    description: desc,
    merchant: merchant,
    status: status,
    category: cat
  }, {w: 1}, function (err, result) {
    if (err) {callback(err); return;}
    callback(null, result);
  });
};

exports.updateTransaction = function (db, params, callback) {
  var transactionId, date;
  if (!ObjectID.isValid(params._id)) {
    callback(new Error('ObjectID is not valid.'));
    return;
  } else {
    transactionId = new ObjectID(params._id);
  }
  if (params.date) {
    date = moment.tz(new Date(params.date), 'America/New_York').toDate();
  }

  var account = db.collection(params.name);
  account.findOne({_id: transactionId}, function (err2, transaction) {
    if (err2) {callback(err2); return;}
    var newTransaction = {
      amount: params.amount || transaction.amount,
      date: date || transaction.date,
      description: params.description || transaction.description,
      merchant: params.merchant || transaction.merchant,
      status: params.status || transaction.status,
      category: params.category || transaction.category
    };
    account.update({_id: transactionId}, newTransaction, {w: 1}, function (err3, result) {
      if (err3) {callback(err3); return;}
      callback(null, newTransaction);
    });
  });
};

exports.deleteTransaction = function (db, params, callback) {
  var account = db.collection(params.name);
  if (!ObjectID.isValid(params._id)) {
    callback(new Error('ObjectID is not valid.'));
    return;
  }
  account.remove({_id: new ObjectID(params._id)}, function (err, result) {
    if (err) {callback(err); return;}
    callback(null, {removed: result});
  });
};
