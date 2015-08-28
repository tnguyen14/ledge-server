'use strict';

var mongod = require('mongod');
var DBURL = process.env.MONGO_URL || "mongodb://mongodb:27017/ledge";

// ensureIndex for `accounts`
mongod(DBURL, ['accounts']).accounts.ensureIndex({name: 1}, {unique: true});

module.exports = mongod(DBURL);