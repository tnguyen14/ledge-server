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
    assert = require('assert'),
    moment = require('moment-timezone'),
    ObjectID = mongodb.ObjectID;

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

/* ACCOUNTS */
server.get('/accounts', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    assert.equal(err, null);
    var accounts = db.collection('accounts');
    accounts.find().toArray(function (err, items) {
      res.send({accounts: items});
      db.close();
      return next();
    });
  });
});

server.get('/accounts/:name', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    var accounts = db.collection('accounts');
    accounts.findOne({name: req.params.name}, function(err, account) {
      if (err) {db.close(); return next(err);}
      // get the transactions
      var accountColl = db.collection(req.params.name);
      accountColl.find().toArray(function (err, transactions) {
        if (err) {db.close(); return next(err);}
        account.transactions = transactions;
        res.json(account);
        db.close();
        return next();
      });
    });
  });
})

// @param name String
// @param starting_balance Double
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

server.put('/accounts/:name', function (req, res, next) {
  if (!req.params.name) {
    return next(new Error('Cannot update account without name'));
  }
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    var accounts = db.collection('accounts'),
        categories = JSON.parse(req.params.categories);
    accounts.findOne({name: req.params.name}, function (err, account) {
      if (err) {db.close(); return next(err);}
      accounts.update({name: req.params.name}, {
        $addToSet: {
          categories: {$each: categories}
        }
      }, {w: 1}, function(err2, result) {
        if (!err2) {
          res.json({updated: result});
          db.close();
          return next();
        }
        else {
          db.close();
          return next(err2);
        }
      });
    });
  });
});

server.del('/accounts/:name', function (req, res, next) {
  var name = req.params.name;
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    var accounts = db.collection('accounts');
    accounts.findOne({name: name}, function (err, result) {
      if (err || !result) {
        db.close();
        return next(new Error('Unable to find account ' + name));
      }
      accounts.remove({name: name}, {w: 1}, function(err, result) {
        if (!err) {
          // delete the account collection
          db.collection(name, {strict: true}, function (err, collection) {
            if (!err) {
              collection.drop(function (err, reply) {
                if (!err) {
                  res.send(reply);
                  db.close();
                  return next();
                }
              })
            } else {
              res.send(200);
              db.close();
              return next();
            }
          });
        }
      });
    });
  });
});

/* TRANSACTIONS */
server.get('/accounts/:name/transactions', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    var account = db.collection(req.params.name);
    account.find().toArray(function (err, items) {
      if (!err) {
        res.send(items);
        db.close();
        return next();
      }
    });
  });
});

// @param date Date
// @param amount Double
// @param description String
// @param category String
server.post('/accounts/:name/transactions', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    if (!req.params.amount) {return next(new Error('Cannot add a transaction without amount.'));}
    var amount = req.params.amount,
        date = req.params.date,
        desc = req.params.description,
        cat = req.params.category;

    var account = db.collection(req.params.name);
    if (!date) {
      date = moment.tz('America/New_York').toDate();
    } else {
      date = moment.tz(new Date(date), 'America/New_York').toDate();
    }

    if (!cat) {
      category = 'Default'
    }
    account.insert({
      amount: amount,
      date: date,
      description: desc,
      category: cat
    }, {w: 1}, function (err, result) {
      if (err) {db.close(); return next(err);}
      res.send(result);
      db.close();
      return next();
    })
  });
});

// @param date Date
// @param amount Double
// @param description String
// @param category String
server.put('/accounts/:name/transactions/:_id', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    var transactionId;
    if (err) {return next(err);}
    if (!ObjectID.isValid(req.params._id)) {
      return next(new Error('ObjectID is not valid.'));
    } else {
      transactionId = new ObjectID(req.params._id);
    }

    if (req.params.date) {
      req.params.date = new Date(req.params.date);
    }
    var account = db.collection(req.params.name);
    account.findOne({_id: transactionId}, function (err2, transaction) {
      if (err2) {db.close(); return next(err);}
      var newTransaction = {
        amount: req.params.amount || transaction.amount,
        date: req.params.date || transaction.date,
        description: req.params.description || transaction.description,
        category: req.params.category || transaction.category
      };
      account.update({_id: transactionId}, newTransaction, {w: 1}, function (err3, result) {
        if (err3) {db.close(); return next(err);}
        res.send(newTransaction);
        db.close();
        return next();
      });
    });
  });
});

server.del('/accounts/:name/transactions/:_id', function (req, res, next) {
  MongoClient.connect(DBURL, function (err, db) {
    if (err) {return next(err);}
    var account = db.collection(req.params.name);
    if (!ObjectID.isValid(req.params._id)) {return next(new Error('ObjectID is not valid.'));}
    account.remove({_id: new ObjectID(req.params._id)}, function (err, result) {
      if (err) {db.close(); return next(err);}
      res.send({removed: result});
      db.close();
      return next();
    })
  });
});

server.listen(process.env.PORT || 3000, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// exports.awesome = function() {
//   return 'awesome';
// };
