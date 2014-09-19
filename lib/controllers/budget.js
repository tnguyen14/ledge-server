'use strict';

var Promise = require('promise'),
  moment = require('moment-timezone');

exports.week = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    var account = db.collection(params.name);
    // get the week offset
    var offset = (+params.offset) * 7;
    // if going back in time
    if (!params.forward) {
      offset = -offset;
    }

    // transactions are bound from this monday to before next monday
    var thisMonday = moment().day(1 + offset).toDate();
    var nextMonday = moment().day(8 + offset).toDate();
    // get transactions
    account.find({date: {$gte: thisMonday, $lt: nextMonday}}).sort({date: 1}).toArray(function (err, items) {
      if (err) {
        reject(err);
      }
      resolve(items);
    });
  });
};