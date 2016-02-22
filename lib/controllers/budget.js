'use strict';

var DB = require('../db');
var moment = require('moment-timezone');
var restifyErrors = require('restify-errors');

var missingAccountName = new restifyErrors.MissingParameterError('An account name is needed to view the current budget period.');

exports.week = function (params) {
	if (!params.name) { throw missingAccountName; }
	// get the week offset
	var offset = (+params.offset) * 7;
	// if going back in time
	if (!params.forward) {
		offset = -offset;
	}

	// transactions are bound from this monday to before next monday
	var thisMonday = moment().day(1 + offset).toDate();
	var nextMonday = moment().day(8 + offset).toDate();

	return DB.collection(params.name).find({date: {$gte: thisMonday, $lt: nextMonday}}).sort({date: -1});
};
