'use strict';

var connectDb = require('../db.js'),
  accounts = require('../controllers/accounts.js'),
  budget = require('../controllers/budget.js');

module.exports = function (server) {
  server.get('/budget', function (req, res, next) {
    res.send('OK');
    return next();
  });

  server.get('/budget/:name', function (req, res, next) {
    connectDb(req, res, next, accounts.showAccount);
  });

  // return transactions in current period
  server.get('/budget/:name/current', function (req, res, next) {

  });
};