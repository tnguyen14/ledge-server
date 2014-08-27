'use strict';

var Router = require('../router.js'),
  accounts = require('../controllers/accounts.js'),
  budget = require('../controllers/budget.js');

module.exports = function (server) {
  server.get('/budget', function (req, res, next) {
    res.send('OK');
    return next();
  });

  // alias for accounts
  server.get('/budget/:name', function (req, res, next) {
    Router.route(req, res, next, accounts.showAccount);
  });

  // return transactions in current period
  server.get('/budget/:name/current', function (req, res, next) {
    if (!req.params.name) {
      return next(new Error('An account name is needed to view the current budget period'));
    }
    Router.route(req, res, next, budget.current);
  });
};