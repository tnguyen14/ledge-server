'use strict';

var accounts = require('./controllers/accounts');
var transactions = require('./controllers/transactions');

function route (controller) {
	return function (req, res, next) {
		if (!controller) {
			res.json();
			return next();
		}
		// Merge req.params and req.body together into a single object
		// This is mostly to be consistent with restify's API before
		controller(Object.assign({}, req.params, req.body), function (err, result) {
			if (err) {
				console.error(err);
				res.status(err.status || 500).json({
					message: err.message
				});
				return next(err);
			}
			res.json(result);
			return next();
		});
	};
}

module.exports = function router (app) {
	// account
	app.get('/accounts', route(accounts.showAll));
	app.get('/accounts/:name', route(accounts.showOne));
	app.post('/accounts', route(accounts.newAccount));
	app.patch('/accounts/:name', route(accounts.updateAccount));
	app.delete('/accounts/:name', route(accounts.deleteAccount));

	// transactions
	app.get('/accounts/:name/transactions', route(transactions.showAll));
	app.post('/accounts/:name/transactions', route(transactions.newTransaction));
	app.get('/accounts/:name/transactions/:id', route(transactions.showOne));
	app.patch('/accounts/:name/transactions/:id', route(transactions.updateTransaction));
	app.delete('/accounts/:name/transactions/:id', route(transactions.deleteTransaction));
	app.get('/accounts/:name/weekly/:offset', route(transactions.showWeekly));
};
