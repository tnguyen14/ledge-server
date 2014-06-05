/*
 * ledge
 * https://github.com/tnguyen14/ledge
 *
 * Copyright (c) 2014 Tri Nguyen
 * Licensed under the MIT license.
 */

'use strict';

var restify = require('restify');

var server = restify.createServer({
  name: 'ledge',
  version: '0.0.1'
});

server.use(restify.CORS());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var MongoClient = require('mongodb').MongoClient;
var DBURL = "mongodb://localhost:27017/ledge";

server.get('/accounts', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    if (err) { return next(err); }
    var accounts = db.collection('accounts');
    accounts.find().toArray(function (err, items) {
      res.send({accounts: items});
      db.close();
      return next();
    });
  });
});

server.post('/accounts', function (req, res, next) {
  // validate req params
  if (!req.params.name || !req.params.starting_balance) {
    return next(new Error('Cannot create account without name or starting balance'));
  }
  var name = req.params.name,
    starting = +req.params.starting_balance;
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    var accounts = db.collection('accounts');
    accounts.ensureIndex({name: 1}, {unique: true}, function (err, indexName) {
      accounts.insert({name: name, starting_balance: starting}, {w: 1}, function (err, result) {
        res.send({account: result});
        db.close();
        return next();
      });
    });
  });
});

server.get('/balance', function (req, res, next) {
  res.json({balance: 0});
  return next();
});

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// exports.awesome = function() {
//   return 'awesome';
// };
