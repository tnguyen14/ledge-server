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
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/balance', function (req, res, next) {
  res.send(0);
  return next();
});

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// exports.awesome = function() {
//   return 'awesome';
// };
