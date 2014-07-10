'use strict';

var DB = require('../db.js'),
  Router = require('../router.js'),
  accounts = require('../controllers/accounts.js');

module.exports = function (server) {
  server.get('/accounts', function (req, res, next) {
    connectDb(req, res, next, accounts.showAll);
  });

  server.get('/accounts/:name', function (req, res, next) {
    Router.route(req, res, next, accounts.showAccount);
  });

  // @param name String
  // @param starting_balance Double
  server.post('/accounts', function (req, res, next) {
    // validate req params
    if (!req.params.name) {
      return next(new Error('Cannot create account without a name.'));
    }
    connectDb(req, res, next, accounts.newAccount);
  });

  // @param categories String array of new categories for eg: '["gas", "food", "groceries"]'
  server.patch('/accounts/:name', function (req, res, next) {
    if (!req.params.name) {
      return next(new Error('Cannot update account without name'));
    }
    connectDb(req, res, next, accounts.updateAccount);
  });

  server.del('/accounts/:name', function (req, res, next) {
    connectDb(req, res, next, accounts.deleteAccount);
  });
}