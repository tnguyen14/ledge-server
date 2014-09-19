'use strict';

var Promise = require('promise'),
  moment = require('moment-timezone');

exports.current = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    var account = db.collection(params.name);
    // get the beginning of the period
    var thisMonday = moment().day(1).toDate();
    var thisSunday = moment().day(7).toDate();
    // get transactions
    account.find({date: {$gte: thisMonday, $lte: thisSunday}}).sort({date: 1}).toArray(function (err, items) {
      if (err) {
        reject(err);
      }
      resolve(items);
    })
  });
}