'use strict';

var db = require('../db');
var moment = require('moment-timezone');
var restifyErrors = require('restify-errors');

var missingAccountName = new restifyErrors.MissingParameterError('An account name is needed to view the current budget period.');

exports.week = function (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	// get the week offset
	var offset = Number(params.offset) * 7;
	// if going back in time
	if (!params.forward) {
		offset = -offset;
	}

	// transactions are bound from this monday to before next monday
	var thisMonday = moment().day(1 + offset).valueOf();
	var nextMonday = moment().day(8 + offset).valueOf();

	db.getRange({
		gte: 'transaction!' + params.name + '!' + thisMonday,
		lt: 'transaction!' + params.name + '!' + nextMonday
	}, callback);
};
