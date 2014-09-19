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
  version: '0.0.2'
});

server.use(restify.CORS());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

/* ROUTES */
require('./routes/accounts.js')(server);
require('./routes/transactions.js')(server);
require('./routes/budget.js')(server);

server.listen(process.env.PORT || 3000, function () {
  console.log('%s listening at %s', server.name, server.url);
});
