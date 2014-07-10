'use strict';

var Router = require('../router.js'),
  transactions = require('../controllers/transactions.js');

module.exports = function (server) {
  server.get('/accounts/:name/transactions', function (req, res, next) {
    if (!req.params.name) {
      return next(new Error('Account name is required.'));
    }
    Router.route(req, res, next, transactions.showAll);
  });

  // @param date Date
  // @param amount Double
  // @param description Stringa
  // @param category String
  server.post('/accounts/:name/transactions', function (req, res, next) {
    if (!req.params.name) {
      return next(new Error('Account name is required.'));
    }
    Router.route(req, res, next, transactions.newTransaction);
  });

  // @param date Date
  // @param amount Double
  // @param description String
  // @param category String
  server.patch('/accounts/:name/transactions/:_id', function (req, res, next) {
    if (!req.params.name) {
      return next(new Error('Account name is required.'));
    }
    Router.route(req, res, next, transactions.updateTransaction);
  });

  server.del('/accounts/:name/transactions/:_id', function (req, res, next) {
    if (!req.params.name) {
      return next(new Error('Account name is required.'));
    }
    Router.route(req, res, next, transactions.deleteTransaction);
  });
};