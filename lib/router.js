'use strict';

var accounts = require('./controllers/accounts');
var transactions = require('./controllers/transactions');
var budget = require('./controllers/budget');

function route (controller) {
	return function (req, res, next) {
		// if no controller passed in, resolve right away
		var handler = controller ? controller(req.params) : Promise.resolve();
		return handler.then(function (result) {
			res.json(result);
			return next();
		}, function (err) {
			console.error(err);
			return next(err);
		});
	};
}

module.exports = function router (server) {
	// account
	server.get('/accounts', route(accounts.showAll));
	server.get('/accounts/:name', route(accounts.showAccount));
	server.post('/accounts', route(accounts.newAccount));
	server.patch('/accounts/:name', route(accounts.updateAccount));
	server.del('/accounts/:name', route(accouts.deleteAccount));

	// transactions
	server.get('/accounts/:name/transactions', route(transactions.showAll));
	server.post('/accounts/:name/transactions', route(transactions.newTransaction));
	server.get('/accounts/:name/transactions/:_id', route(transactions.showOne));
	server.patch('/accounts/:name/transactions/:_id', route(transactions.updateTransaction));
	server.del('/accounts/:name/transactions/:_id', route(transactions.deleteTransaction));

	// budget
	server.get('/budget', route());
	// alias for accounts
	server.get('/budget/:name', route(accounts.showAccount));
	// return transactions in current week
	server.get('/budget/:name/current', route(function (params) {
		return budget.week.call(undefined, Object.assign({}, params, {offset: 0}));
	}));
	// return transactions in next week(s)
	server.get('/budget/:name/next/:offset', route(function (params) {
		return budget.week.call(undefined, Object.assign({}, params, {forward: true}));
	}));
	// return transactions in previous week(s)
	server.get('/budget/:name/prev/:offset', route(function (params) {
		return budget.week.call(undefined, Object.assign({}, params, {forward: false}));
	}));
};
