/*
 * ledge
 * https://github.com/tnguyen14/ledge
 *
 * Copyright (c) 2014 Tri Nguyen
 * Licensed under the MIT license.
 */

'use strict';

var restify = require('restify'),
    mongodb = require('mongodb'),
    assert = require('assert');

var accounts = require('./accounts.js'),
    transactions = require('./transactions');

var server = restify.createServer({
  name: 'ledge',
  version: '0.0.1'
});

server.use(restify.CORS());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var MongoClient = mongodb.MongoClient;
var DBURL = process.env.MONGOHQ_URL || "mongodb://localhost:27017/ledge";

var connectDb = function (req, res, next, callback) {
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

/* ACCOUNTS */
server.get('/accounts', function (req, res, next) {
  connectDb(req, res, next, accounts.showAll);
});

server.get('/accounts/:name', function (req, res, next) {
  connectDb(req, res, next, accounts.showAccount);
});

// @param name String
// @param starting_balance Double
server.post('/accounts', function (req, res, next) {
  // validate req params
  if (!req.params.name || !req.params.starting_balance) {
    return next(new Error('Cannot create account without name or starting balance'));
  }
  connectDb(req, res, next, accounts.newAccount);
});

server.patch('/accounts/:name', function (req, res, next) {
  if (!req.params.name) {
    return next(new Error('Cannot update account without name'));
  }
  connectDb(req, res, next, accounts.updateAccount);
});

server.del('/accounts/:name', function (req, res, next) {
  connectDb(req, res, next, accounts.deleteAccount);
});

/* TRANSACTIONS */
server.get('/accounts/:name/transactions', function (req, res, next) {
  if (!req.params.name) {
    return next(new Error('Account name is required.'));
  }
  connectDb(req, res, next, transactions.showAll);
});

// @param date Date
// @param amount Double
// @param description Stringa
// @param category String
server.post('/accounts/:name/transactions', function (req, res, next) {
  if (!req.params.name) {
    return next(new Error('Account name is required.'));
  }
  connectDb(req, res, next, transactions.newTransaction);
});

// @param date Date
// @param amount Double
// @param description String
// @param category String
server.patch('/accounts/:name/transactions/:_id', function (req, res, next) {
  if (!req.params.name) {
    return next(new Error('Account name is required.'));
  }
  connectDb(req, res, next, transactions.updateTransaction);
});

server.del('/accounts/:name/transactions/:_id', function (req, res, next) {
  if (!req.params.name) {
    return next(new Error('Account name is required.'));
  }
  connectDb(req, res, next, transactions.deleteTransaction);
});

server.listen(process.env.PORT || 3000, function () {
  console.log('%s listening at %s', server.name, server.url);
});
