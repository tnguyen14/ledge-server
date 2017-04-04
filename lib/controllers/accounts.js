'use strict';

var db = require('../db');
var _ = require('lodash');
var noAccount = new Error('No such account was found');
noAccount.status = 404;
var missingAccountName = new Error('Account name is required.');
missingAccountName.status = 404;
var conflictAccountName = new Error('Account already exists');
conflictAccountName.status = 409;

function showAll (params, callback) {
	db.getRange({
		gte: 'account!',
		lt: 'account!~'
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
	db.get('account!' + params.name, function (err, account) {
		if (err) {
			if (err.notFound) {
				callback(noAccount);
			} else {
				callback(err);
			}
			return;
		}
		callback(null, account);
	});
}

// starting_balance defaults to 0
// type defaults to BUDGET. Other values include: CHECKING.
function newAccount (params, callback) {
	if (!params.name) {
		return callback(missingAccountName);
	}

	db.get('account!' + params.name, function (err, account) {
		if (!err) {
			return callback(conflictAccountName);
		}
		var newAccount = {
			starting_balance: params.starting_balance ? Number(params.starting_balance) : 0,
			type: params.type || 'BUDGET'
		};

		// add default period length to 4 weeks
		if (newAccount.type === 'BUDGET') {
			newAccount.period_length = 4;
			newAccount.period_budget = 0;
		}
		db.put('account!' + params.name, newAccount, function (err) {
			if (err) {
				return callback(err);
			}
			callback(null, {
				created: true
			});
		});
	});
}

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
			opts.starting_balance = parseInt(params.starting_balance, 10);
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
