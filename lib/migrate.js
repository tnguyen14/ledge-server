#!/usr/bin/env node

var backup = require('../data/backup.json');
var db = require('level')('./data', {valueEncoding: 'json'});
var moment = require('moment-timezone');

db.put('account!' + backup.name, {
	type: backup.type,
	starting_balance: backup.starting_balance,
	period_length: backup.period_length,
	period_budget: backup.period_budget,
	merchants_count: backup.merchants_count
}, function (err) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log('Created account ' + backup.name);

	db.batch(backup.transactions.map(function (tx) {
		// use the `date` value as id
		var id = moment(tx.date).valueOf();
		return {
			type: 'put',
			key: 'transaction!' + backup.name + '!' + id,
			value: {
				amount: parseInt(tx.amount, 10),
				date: tx.date,
				description: tx.description,
				merchant: tx.merchant,
				status: tx.status,
				category: tx.category,
				source: tx.source
			}
		};
	}), function (err) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log('Migrated ' + backup.transactions.length + ' transactions to account ' + backup.name + ' successfully.');
		process.exit();
	});
});
