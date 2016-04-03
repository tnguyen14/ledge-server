'use strict';

var db = require('../db');
var moment = require('moment-timezone');
var _ = require('lodash');
var slugify = require('underscore.string/slugify');
var async = require('async');
var restifyErrors = require('restify-errors');
var timezone = 'America/New_York';
var SEPARATOR = '!';

var missingAccountName = new restifyErrors.MissingParameterError('Account name is required.');

/** MERCHANTS COUNT **/

/**
 * @param {String} merchant name of merchant
 * @param {Object} counts the counts object
 */
function addMerchantToCounts (merchant, counts) {
	var slug = slugify(merchant);
	var _counts = counts || {};
	if (_counts[slug]) {
		_counts[slug].count++;
		// store the merchant name in an array, in case of variations of the same name
		if (_counts[slug].values.indexOf(merchant) === -1) {
			_counts[slug].values.push(merchant);
		}
	} else {
		_counts[slug] = {
			count: 1,
			values: [merchant]
		};
	}
	return _counts;
}

/**
 * @param {String} merchant name of merchant to be removed
 * @param {Object} counts the counts object
 * @param {Boolean} removeValue whether the merchant should be removed from the values array
 */
function removeMerchantFromCounts (merchant, counts, removeValue) {
	var slug = slugify(merchant);
	var _counts = counts;
	// if the count doesn't exist, bail early
	if (!_counts[slug]) {
		return counts;
	}
	_counts[slug].count--;

	// if the count is 0, remove it
	if (_counts[slug].count === 0) {
		delete _counts[slug];
	// remove merchant from values array
	} else if (removeValue) {
		var merchantIndex = _counts[slug].values.indexOf(merchant);
		if (merchantIndex !== -1) {
			_counts[slug].values.splice(merchantIndex, 1);
		}
	}
	return _counts;
}

/**
 * @description add a merchant to an account
 * @param {String} merchant name of merchant
 * @param {String} account name of account
 */
function addMerchant (merchant, account, callback) {
	db.get('account!' + account, function (err, acc) {
		if (err) {
			return callback(err);
		}
		db.put('account!' + account, Object.assign({}, acc, {
			merchants_count: addMerchantToCounts(merchant, acc.merchants_count)
		}), function (err) {
			if (err) {
				return callback(err);
			}
			callback(null);
		});
	});
}

/**
 * @description update a merchant, remove the old one if necessary
 * @param {String} newMerchant name of new merchant to be added
 * @param {String} oldMerchant name of old merchant to be removed
 * @param {String} account name of account
 */
function updateMerchant (newMerchant, oldMerchant, account, callback) {
	// if the new merchant is same as old, do nothing
	if (!newMerchant || newMerchant === oldMerchant) {
		return callback();
	}

	removeMerchant(oldMerchant, account, function (err) {
		if (err) {
			return callback(err);
		}
		addMerchant(newMerchant, account, callback);
	});
}

/**
 * @description remove a merchant from an account
 * @param {String} merchant name of merchant
 * @param {String} account name of account
 */
function removeMerchant (merchant, account, callback) {
	db.get('account!' + account, function (err, acc) {
		if (err) {
			return callback(err);
		}
		db.getRange({
			gt: 'transaction!' + account + '!',
			lt: 'transaction!' + account + '!~'
		}, function (err2, items) {
			if (err2) {
				return callback(err2);
			}
			var merchantCount = _.filter(items, {merchant: merchant}).length;
			db.put('account!' + account, Object.assign({}, acc, {
				merchants_count: removeMerchantFromCounts(merchant, acc.merchants_count, merchantCount === 1 || merchantCount === 0)
			}), function (err) {
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

/**
 * Check if the id is unique. If not, keep incrementing it until it is
 * @param {Number} id time value as id
 * @param {String} accountName account name
 * @param {Function} callback
 */
function getUniqueTransactionId (id, accountName, callback) {
	var _id = id;
	var notFound = false;
	async.until(
		function () { return notFound; },
		function (cb) {
			db.get(['transaction', accountName, _id].join(SEPARATOR), function (err) {
				if (err && err.notFound) {
					notFound = true;
				} else {
					_id++;
				}
				cb(null, _id);
			});
		},
		callback
	);
}

/** TRANSATIONS ACTIONS **/

function showAll (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	db.getRange({
		gt: 'transaction!' + params.name + '!',
		lt: 'transaction!' + params.name + '!~'
	}, function (err, items) {
		if (err) {
			return callback(err);
		}
		callback(null, items.map(function (item) {
			return Object.assign({}, item.value, {
				id: item.key.split('!').pop()
			});
		}));
	});
}

function showWeekly (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	var weekOffset = params.offset || 0;
	var dayOffset = Number(weekOffset) * 7;

	// transactions are bound from this monday to before next monday
	// Monday is number 1 http://momentjs.com/docs/#/get-set/day/
	var thisMonday = moment().day(1 + dayOffset).valueOf();
	var nextMonday = moment().day(8 + dayOffset).valueOf();
	db.getRange({
		gte: 'transaction!' + params.name + '!' + thisMonday,
		lt: 'transaction!' + params.name + '!' + nextMonday
	}, function (err, items) {
		if (err) {
			return callback(err);
		}
		callback(null, items.map(function (item) {
			return Object.assign({}, item.value, {
				id: item.key.split('!').pop()
			});
		}));
	});
}

function showOne (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	db.get('transaction!' + params.name + '!' + params.id, function (err, transaction) {
		if (err) {
			if (err.notFound) {
				callback(new restifyErrors.NotFoundError('No such transaction was found.'));
			} else {
				callback(err);
			}
			return;
		}
		callback(null, transaction);
	});
}

function newTransaction (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	if (!params.amount) {
		return callback(new restifyErrors.MissingParameterError('Cannot add a transaction without amount.'));
	}
	if (!params.date || !params.time) {
		callback(new restifyErrors.MissingParameterError('Cannot add a transaction without date and time.'));
	}
	var date = moment.tz(params.date + ' ' + (params.time || '08:00'), timezone);
	var id = date.valueOf();
	var uniqueId;

	async.series([
		function (cb) {
			getUniqueTransactionId(id, params.name, function (err, res) {
				if (!err) {
					uniqueId = res;
				}
				cb(err);
			});
		},
		function (cb) {
			db.put(['transaction', params.name, uniqueId].join(SEPARATOR), {
				amount: parseInt(params.amount, 10),
				date: date.toDate(),
				description: params.description,
				merchant: params.merchant,
				status: params.status || 'POSTED',
				category: params.category || 'default',
				source: params.source
			}, cb);
		},
		function (cb) {
			addMerchant(params.merchant, params.name, cb);
		}
	], function (err) {
		if (err) {
			return callback(err);
		}
		callback(null, {
			created: true,
			id: uniqueId
		});
	});
}

function updateTransaction (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	if (!params.id) {
		return callback(new restifyErrors.MissingParameterError('Transaction ID is missing.'));
	}
	var oldTransactionId = ['transaction', params.name, params.id].join(SEPARATOR);
	// opts is a conditional subset of params with some parsing
	var opts = {};
	var newTransaction, oldTransaction, newTransactionId, date, hasDateChange;
	if (params.date && params.time) {
		date = moment.tz(params.date + ' ' + (params.time || '08:00'), timezone);
		opts.date = date.toDate();
	}
	if (params.amount) {
		opts.amount = parseInt(params.amount, 10);
	}
	opts.updatedOn = Date.now();
	newTransaction = Object.assign({}, _.pick(params, [
		// only update specified properties
		'amount',
		'date',
		'description',
		'merchant',
		'status',
		'category',
		'source'
	]), opts);

	async.series([
		// get the old transaction
		function (cb) {
			db.get(oldTransactionId, function (err, transaction) {
				oldTransaction = transaction;
				// check if date has changed
				if (date && !date.isSame(oldTransaction.date)) {
					hasDateChange = true;
				}
				cb(err);
			});
		},
		// set the new transaction id to a unique id if date has changed
		function (cb) {
			if (!hasDateChange) {
				newTransactionId = oldTransactionId;
				return cb(null);
			}
			getUniqueTransactionId(date.valueOf(), params.name, function (err, id) {
				if (!err) {
					newTransactionId = ['transaction', params.name, id].join(SEPARATOR);
				}
				cb(null);
			});
		},
		// write new transaction
		function (cb) {
			db.put(newTransactionId, Object.assign({}, oldTransaction, newTransaction), cb);
		},
		function (cb) {
			updateMerchant(newTransaction.merchant, oldTransaction.merchant, params.name, cb);
		},
		// if date has changed, remove the old transaction
		function (cb) {
			if (!hasDateChange) {
				return cb(null);
			}
			deleteTransaction({
				name: params.name,
				id: params.id
			}, cb);
		}
	], function (err) {
		if (err) {
			return callback(err);
		}
		callback(null, {
			updated: true
		});
	});
}

function deleteTransaction (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	var transactionId = 'transaction!' + params.name + '!' + params.id;
	async.waterfall([
		async.apply(db.get.bind(db), transactionId),
		function (transaction, cb) {
			removeMerchant(transaction.merchant, params.name, cb);
		},
		async.apply(db.del.bind(db), transactionId)
	], function (err) {
		if (err) {
			return callback(err);
		}
		callback(null, {
			deleted: true
		});
	});
}

module.exports = {
	showAll: showAll,
	showWeekly: showWeekly,
	showOne: showOne,
	newTransaction: newTransaction,
	updateTransaction: updateTransaction,
	deleteTransaction: deleteTransaction
};
