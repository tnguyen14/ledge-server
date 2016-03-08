'use strict';

var db = require('../db');
var transactions = require('./transactions');
var _ = require('lodash');
var restifyErrors = require('restify-errors');
var noAccount = new restifyErrors.NotFoundError('No such account was found');
var missingAccountName = new restifyErrors.MissingParameterError('Account name is required.');

function showAll (params, callback) {
	db.getRange({
		gte: 'account!',
		lt: 'account!~'
	}, callback);
}

function showOne (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	db.get('account!' + params.name, function (err, account) {
		if (err) {
			if (err.notFound) {
				callback(noAccount);
			} else {
				callback(err);
			}
			return;
		}
		transactions.showAll(params, function (err, tx) {
			if (err) {
				return callback(err);
			}
			account.transactions = tx;
			callback(null, account);
		});
	});
}

// starting_balance defaults to 0
// type defaults to BUDGET. Other values include: CHECKING.
function newAccount (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	var account = {
		starting_balance: (params.starting_balance) ? +params.starting_balance : 0,
		type: params.type || 'BUDGET'
	};

	// add default period length to 4 weeks
	if (account.type === 'BUDGET') {
		account.period_length = 4;
		account.period_budget = 0;
	}
	db.put('account!' + params.name, account, function (err) {
		if (err) {
			return callback(err);
		}
		callback(null, {
			created: true
		});
	});
}

// currently only support adding categories to account
function updateAccount (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	db.get('account!' + params.name, function (err, account) {
		if (err) {
			return callback(err);
		}
		var opts = {};
		if (params.categories && params.categories[0] === '[' && params.categories[-1] === ']') {
			opts.categories = _.union(JSON.parse(params.categories), account.categories);
		}
		if (params.starting_balance) {
			opts.starting_balance = Number(params.starting_balance);
		}
		db.put('account!' + params.name, Object.assign({}, account, _.pick(params, ['type', 'categories', 'starting_balance', 'period_length', 'period_budget']), opts), function (err) {
			if (err) {
				return callback(err);
			}
			callback(null, {
				updated: true
			});
		});
	});
}

function deleteAccount (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}
	db.get('account!' + params.name, function (err, account) {
		if (err) {
			if (err.notFound) {
				callback(noAccount);
			} else {
				callback(err);
			}
			return;
		}
		// delete transactions associated with the account as well
		db.getRange({
			gt: 'transaction!' + params.name + '!',
			lt: 'transaction!' + params.name + '!~'
		}, function (err, transactions) {
			if (err) {
				return callback(err);
			}
			db.batch(transactions.map(function (tx) {
				return {
					type: 'del',
					key: tx.key
				};
			}).concat({
				type: 'del',
				key: 'account!' + params.name
			}), function (err) {
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
	newAccount: newAccount,
	updateAccount: updateAccount,
	deleteAccount: deleteAccount
};
