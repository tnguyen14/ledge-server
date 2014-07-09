'use strict';

var mongodb = require('mongodb'),
  MongoClient = mongodb.MongoClient,
  DBURL = process.env.MONGOHQ_URL || "mongodb://localhost:27017/ledge";

module.exports = function (req, res, next, callback) {
  MongoClient.connect(DBURL, function(err, db) {
    if (err) {return next(err);}
    callback(db, req.params, function (err, result) {
      if (err) {db.close(); return next(err);}
      res.json(result);
      db.close();
      return next();
    });
  });
};