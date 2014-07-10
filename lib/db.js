'use strict';

var RSVP = require('rsvp'),
  mongodb = require('mongodb'),
  MongoClient = mongodb.MongoClient,
  DBURL = process.env.MONGOHQ_URL || "mongodb://localhost:27017/ledge";

exports.connect = function () {
  return new RSVP.Promise(function (resolve, reject) {
    MongoClient.connect(DBURL, function(err, db) {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
};
