'use strict';

var accounts = require('./controllers/accounts');
var transactions = require('./controllers/transactions');
var budget = require('./controllers/budget');

function route (controller) {
	return function (req, res, next) {
		if (!controller) {
			res.json();
			return next();
		}
		controller(req.params, function (err, result) {
			if (err) {
				console.error(err);
				return next(err);
			}
			res.json(result);
			return next();
		});
	};
}

module.exports = function router (server) {
	// account
	server.get('/accounts', route(accounts.showAll));
	server.get('/accounts/:name', route(accounts.showOne));
	server.post('/accounts', route(accounts.newAccount));
	server.patch('/accounts/:name', route(accounts.updateAccount));
	server.del('/accounts/:name', route(accounts.deleteAccount));

	// transactions
	server.get('/accounts/:name/transactions', route(transactions.showAll));
	server.post('/accounts/:name/transactions', route(transactions.newTransaction));
	server.get('/accounts/:name/transactions/:id', route(transactions.showOne));
	server.patch('/accounts/:name/transactions/:id', route(transactions.updateTransaction));
	server.del('/accounts/:name/transactions/:id', route(transactions.deleteTransaction));

	// budget
	server.get('/budget', route());
	// alias for accounts
	server.get('/budget/:name', route(accounts.showAccount));
	// return transactions in current week
	server.get('/budget/:name/current', route(function (params, callback) {
		budget.week.call(undefined, Object.assign({}, params, {offset: 0}), callback);
	}));
	// return transactions in next week(s)
	server.get('/budget/:name/next/:offset', route(function (params, callback) {
		budget.week.call(undefined, Object.assign({}, params, {forward: true}), callback);
	}));
	// return transactions in previous week(s)
	server.get('/budget/:name/prev/:offset', route(function (params, callback) {
		budget.week.call(undefined, Object.assign({}, params, {forward: false}), callback);
	}));
};
