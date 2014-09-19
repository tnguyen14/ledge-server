'use strict';

var Promise = require('promise'),
    moment = require('moment-timezone'),
    ObjectID = require('mongodb').ObjectID;

exports.showAll = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    var account = db.collection(params.name);
    account.find().sort({date: 1}).toArray(function (err, items) {
      if (err) {
        reject(err);
      }
      resolve(items);
    });
  });
};

exports.newTransaction = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    if (!params.amount) {
      reject(new Error('Cannot add a transaction without amount.'));
    }
    var amount = +params.amount,
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
      if (err) {reject(err);}
      resolve(result);
    });
  });
};

exports.updateTransaction = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    var transactionId, date;
    if (!ObjectID.isValid(params._id)) {
      reject(new Error('ObjectID is not valid.'));
    }

    transactionId = new ObjectID(params._id);
    if (params.date) {
      date = moment.tz(new Date(params.date), 'America/New_York').toDate();
    }

    var account = db.collection(params.name);
    account.findOne({_id: transactionId}, function (err, transaction) {
      if (err) {reject(err);}
      var updatedProperties = {
        amount: params.amount || transaction.amount,
        date: date || transaction.date,
        description: params.description || transaction.description,
        merchant: params.merchant || transaction.merchant,
        status: params.status || transaction.status,
        category: params.category || transaction.category
      };
      account.update({_id: transactionId}, {$set: updatedProperties}, {w: 1}, function (err, result) {
        if (err) {reject(err);}
        resolve(updatedProperties);
      });
    });
  });
};

exports.deleteTransaction = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    var account = db.collection(params.name);
    if (!ObjectID.isValid(params._id)) {
      reject(new Error('ObjectID is not valid.'));
    }
    account.remove({_id: new ObjectID(params._id)}, function (err, result) {
      if (err) {reject(err);}
      resolve({removed: result});
    });
  });
};
