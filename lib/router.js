'use strict';

var DB = require('./db.js');

exports.route = function (req, res, next, controller) {
  DB.connect().then(function (db) {
    return controller(db, req.params)
      .then(function (account) {
        res.json(account);
        db.close();
        return next();
      }, function (err) {
        db.close();
        return next(err);
      });
  }).catch(function (err) {
    return next(err);
  });
};