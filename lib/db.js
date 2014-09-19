'use strict';

var mongod = require('mongod');
var DBURL = process.env.MONGO_URL || "mongodb://localhost:27017/ledge";

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
