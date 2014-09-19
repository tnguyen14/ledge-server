'use strict';

var mongod = require('mongod');
var DBURL = process.env.MONGO_URL || "mongodb://localhost:27017/ledge";

// ensureIndex for `accounts`
mongod(DBURL, ['accounts']).accounts.ensureIndex({name: 1}, {unique: true});

module.exports = mongod(DBURL);

// exports.connect = function () {
//   return new RSVP.Promise(function (resolve, reject) {
//     MongoClient.connect(DBURL, function(err, db) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(db);
//       }
//     });
//   });
// };
