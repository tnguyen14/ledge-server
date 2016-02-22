'use strict';

var DB = require('../db');
var moment = require('moment-timezone');
var _ = require('lodash');
var ObjectId = require('mongod').ObjectId;
var slugify = require('underscore.string/slugify');
var restifyErrors = require('restify-errors');

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
function addMerchant (merchant, account) {
	return DB.collection('accounts').findOne({name: account}).then(function (acc) {
		return DB.collection('accounts').update({name: account}, {
			$set: {
				merchants_count: addMerchantToCounts(merchant, acc.merchants_count)
			}
		});
	});
}

/**
 * @description update a merchant, remove the old one if necessary
 * @param {String} newMerchant name of new merchant to be added
 * @param {String} oldMerchant name of old merchant to be removed
 * @param {String} account name of account
 */
function updateMerchant (newMerchant, oldMerchant, account) {
	// if the new merchant is same as old, do thing
	if (newMerchant === oldMerchant) {
		return Promise.resolve();
	}

	return Promise.all([
		DB.collection('accounts').findOne({name: account}),
		DB.collection(account).count({
			merchant: oldMerchant
		})
	]).then(function (res) {
		var merchantsCount = res[0].merchants_count;
		merchantsCount = removeMerchantFromCounts(oldMerchant, merchantsCount, res[1] === 1 || res[1] === 0);
		merchantsCount = addMerchantToCounts(newMerchant, merchantsCount);

		return DB.collection('accounts').update({name: account}, {
			$set: {
				merchants_count: merchantsCount
			}
		});
	});
}

/**
 * @description remove a merchant from an account
 * @param {String} merchant name of merchant
 * @param {String} account name of account
 */
function removeMerchant (merchant, account) {
	return Promise.all([
		DB.collection('accounts').findOne({name: account}),
		DB.collection(account).count({
			merchant: merchant
		})
	]).then(function (res) {
		return DB.collection('accounts').update({name: account}, {
			$set: {
				merchants_count: removeMerchantFromCounts(merchant, res[0].merchants_count, res[1] === 1 || res[1] === 0)
			}
		});
	});
}

/** TRANSATIONS ACTIONS **/

function showAll (params) {
	if (!params.name) {
		throw missingAccountName;
	}
	return DB.collection(params.name).find().sort({date: -1});
}

function showOne (params) {
	if (!params.name) {
		throw missingAccountName;
	}
	return DB.collection(params.name).findOne({_id: new ObjectId(params._id)});
}

function newTransaction (params) {
	if (!params.name) {
		throw missingAccountName;
	}
	if (!params.amount) {
		throw new restifyErrors.MissingParameterError('Cannot add a transaction without amount.');
	}
	var amount = +params.amount;
	var date;
	if (params.date) {
		date = params.date + ' ' + (params.time || '08:00');
	}
	date = moment.tz(date, 'America/New_York').toDate();
	var desc = params.description;
	var merchant = params.merchant;
	var source = params.source;
	var status = params.status || 'POSTED';
	var cat = params.category || 'default';

	return addMerchant(merchant, params.name).then(function () {
		return DB.collection(params.name).insert({
			amount: amount,
			date: date,
			description: desc,
			merchant: merchant,
			status: status,
			category: cat,
			source: source
		});
	});
}

function updateTransaction (params) {
	if (!params.name) {
		throw missingAccountName;
	}
	var transactionId = new ObjectId(params._id);
	if (params.date) {
		params.date = moment.tz(params.date + ' ' + (params.time || '08:00'), 'America/New_York').toDate();
	}
	if (params.amount) {
		params.amount = +params.amount;
	}

	var account = DB.collection(params.name);
	return account.findOne({_id: transactionId}, {_id: 0}).then(function (transaction) {
		return updateMerchant(params.merchant, transaction.merchant, params.name)
			.then(function () {
				return account.update({_id: transactionId}, {$set: _.extend(transaction, _.pick(params, [
					// only update specified properties
					'amount',
					'date',
					'description',
					'merchant',
					'status',
					'category',
					'source'
				]))
				});
			});
	});
}

function deleteTransaction (params) {
	if (!params.name) {
		throw missingAccountName;
	}
	var account = DB.collection(params.name);
	return account.findOne({_id: new ObjectId(params._id)}).then(function (transaction) {
		if (!transaction) {
			throw new Error('Cannot find transaction with _id ' + params._id);
		}
		return removeMerchant(transaction.merchant, params.name)
			.then(function () {
				return account.remove({_id: new ObjectId(params._id)});
			});
	});
}

module.exports.showAll = showAll;
module.exports.showOne = showOne;
module.exports.newTransaction = newTransaction;
module.exports.updateTransaction = updateTransaction;
module.exports.deleteTransaction = deleteTransaction;
