'use strict';

var db = require('../db');
var moment = require('moment-timezone');
var _ = require('lodash');
var slugify = require('underscore.string/slugify');
var restifyErrors = require('restify-errors');
var timezone = 'America/New_York';

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

/** TRANSATIONS ACTIONS **/

function showAll (params, callback) {
	if (!params.name) {
		callback(missingAccountName);
	}
	db.getRange({
		gt: 'transaction!' + params.name + '!',
		lt: 'transaction!' + params.name + '!~'
	}, callback);
}

function showOne (params, callback) {
	if (!params.name) {
		callback(missingAccountName);
	}
	db.get('transaction!' + params.name + '!' + params.id, function (err, transaction) {
		if (err) {
			return callback(err);
		}
		callback(null, transaction);
	});
}

function newTransaction (params, callback) {
	if (!params.name) {
		callback(missingAccountName);
	}
	if (!params.amount) {
		callback(new restifyErrors.MissingParameterError('Cannot add a transaction without amount.'));
	}
	var date;
	if (params.date) {
		date = moment.tz(params.date + ' ' + (params.time || '08:00'), timezone).toDate();
	}
	var id = Date.now();

	db.put('transaction!' + params.name + '!' + id, {
		amount: Number(params.amount),
		date: date,
		description: params.description,
		merchant: params.merchant,
		status: params.status || 'POSTED',
		category: params.category || 'default',
		source: params.source
	}, function (err) {
		if (err) {
			return callback(err);
		}
		callback(null, {
			created: true,
			id: date
		});
		addMerchant(params.merchant, params.name);
	});
}

function updateTransaction (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	if (!params.id) {
		return callback(new restifyErrors.MissingParameterError('Transaction ID is missing.'));
	}
	var transactionId = 'transaction!' + params.name + '!' + params.id;
	var opts = {};
	if (params.date) {
		opts.date = moment.tz(params.date + ' ' + (params.time || '08:00'), timezone).toDate();
	}
	if (params.amount) {
		opts.amount = Number(params.amount);
	}
	opts.updatedOn = Date.now();
	db.get(transactionId, function (err, transaction) {
		if (err) {
			return callback(err);
		}
		db.put(transactionId, Object.assign({}, transaction, _.pick(params, [
			// only update specified properties
			'amount',
			'date',
			'description',
			'merchant',
			'status',
			'category',
			'source'
		]), opts), function (err) {
			if (err) {
				return callback(err);
			}
			callback(null, {
				updated: true
			});
			updateMerchant(params.merchant, transaction.merchant, params.name);
		});
	});
}

function deleteTransaction (params, callback) {
	if (!params.name) {
		callback(missingAccountName);
	}
	var transactionId = 'transaction!' + params.name + '!' + params.id;
	db.get(transactionId, function (err, transaction) {
		if (err) {
			return callback(err);
		}
		removeMerchant(transaction.merchant, params.name)
		.then(function () {
			db.del(transactionId, function (err) {
				if (err) {
					return callback(err);
				}
				callback(null, {
					deleted: true
				});
			});
		});
	});
}

module.exports = {
	showAll: showAll,
	showOne: showOne,
	newTransaction: newTransaction,
	updateTransaction: updateTransaction,
	deleteTransaction: deleteTransaction
};
