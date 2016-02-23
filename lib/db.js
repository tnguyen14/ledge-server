'use strict';

var level = require('level');

var db = level('./data', {valueEncoding: 'json'});

module.exports = db;
module.exports.getRange = function (options, callback) {
	var items = [];
	db.createReadStream(options)
	.on('data', function (item) {
		items.push(item);
	})
	.on('error', callback)
	.on('close', function () {
		callback(null, items);
	});
};
