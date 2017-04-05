/*
 * ledge
 * https://github.com/tnguyen14/ledge
 *
 * Copyright (c) 2014 Tri Nguyen
 * Licensed under the MIT license.
 */

'use strict';

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();

app.use(cors());
app.use(bodyParser.json());

// docs
app.use('/docs', express.static('doc'));

require('./router')(app);

var server = app.listen(process.env.PORT || 3000, function () {
	console.log('Server listening on port %s', server.address().port);
});
