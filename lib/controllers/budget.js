'use strict';

var Promise = require('promise'),
  moment = require('moment-timezone');

exports.current = function (db, params, callback) {
  return new Promise(function (resolve, reject) {
    var account = db.collection(params.name);
    account.find().toArray(function (err, items) {
      if (err) {
        reject(err);
      }
      resolve(items);
    })
  });
}