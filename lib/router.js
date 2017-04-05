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
	/**
	 * @api {get} /accounts Get all accounts
	 * @apiName GetAllAccounts
	 * @apiGroup Account
	 */
	app.get('/accounts', route(accounts.showAll));

	/**
	 * @api {get} /accounts/:name Get an account with name
	 * @apiName GetAccount
	 * @apiGroup Account
	 *
	 * @apiParam {String} name Name of the account
	 */
	app.get('/accounts/:name', route(accounts.showOne));

	/**
	 * @api {post} /accounts Create a new account
	 * @apiName CreateAccount
	 * @apiGroup Account
	 *
	 * @apiParam {String} name Name of account
	 * @apiParam {Number} starting_balance=0 Starting balance
	 * @apiParam {String="BUDGET"} type="BUDGET" Type of account
	 */
	app.post('/accounts', route(accounts.newAccount));

	/**
	 * @api {patch} /accounts/:name Update an account
	 * @apiName UpdateAccount
	 * @apiGroup Account
	 *
	 * @apiParam {String} name Name of account
	 * @apiParam {Number} starting_balance
	 * @apiParam {String="BUDGET"} type
	 * @apiParam {mixed} categories Array of new categories.
	 *           Send a string in the format of '["newCat"]' to add new
	 *           category without replacing the old categories
	 * @apiParam {Number} period_length Length of a budget account period
	 * @apiParam {Number} period_budget Budget for a budget account
	 */
	app.patch('/accounts/:name', route(accounts.updateAccount));

	/**
	 * @api {delete} /accounts/:name Delete an account
	 * @apiName DeleteAccount
	 * @apiGroup Account
	 *
	 * @apiParam {String} name Name of account to be deleted
	 */
	app.delete('/accounts/:name', route(accounts.deleteAccount));

	// transactions

	/**
	 * @api {get} /accounts/:name/transactions Get all transactions of an account
	 * @apiName GetAllTransactions
	 * @apiGroup Transaction
	 *
	 * @apiParam {String} name Name of account
	 */
	app.get('/accounts/:name/transactions', route(transactions.showAll));

	/**
	 * @api {post} /accounts/:name/transactions Create new transaction for account
	 * @apiName CreateTransaction
	 * @apiGroup Transaction
	 *
	 * @apiParam {String} name Name of account to add the transaction to
	 * @apiParam {Number} amount
	 * @apiParam {String} date
	 * @apiParam {String} time
	 * @apiParam {String} description
	 * @apiParam {String} merchant
	 * @apiParam {String="POSTED"} status="POSTED"
	 * @apiParam {String} category="default"
	 * @apiParam {String} source
	 */
	app.post('/accounts/:name/transactions', route(transactions.newTransaction));

	/**
	 * @api {get} /accounts/:name/transactions/:id Get a transaction
	 * @apiName GetTransaction
	 * @apiGroup Transaction
	 *
	 * @apiParam {String} name Name of account
	 * @apiParam {String} id ID of the transaction
	 */
	app.get('/accounts/:name/transactions/:id', route(transactions.showOne));

	/**
	 * @api {patch} /accounts/:name/transactions/:id Update a transaction
	 * @apiName UpdateTransaction
	 * @apiGroup Transaction
	 *
	 * @apiParam {String} name Name of account that has the transaction
	 * @apiParam {String} id ID of the transaction to be updated
	 * @apiParam {Number} amount
	 * @apiParam {String} date
	 * @apiParam {String} time
	 * @apiParam {String} description
	 * @apiParam {String} merchant
	 * @apiParam {String="POSTED"} status
	 * @apiParam {String} category
	 * @apiParam {String} source
	 */
	app.patch('/accounts/:name/transactions/:id', route(transactions.updateTransaction));

	/**
	 * @api {delete} /accounts/:name/transactions/:id Delete a transaction
	 * @apiName DeleteTransaction
	 * @apiGroup Transaction
	 *
	 * @apiParam {String} name Name of account
	 * @apiParam {String} id ID of transaction to be deleted
	 */
	app.delete('/accounts/:name/transactions/:id', route(transactions.deleteTransaction));

	/**
	 * @api {get} /accounts/:name/weekly/:offset Get all transactions within a week
	 * @apiName GetWeeklyTransactions
	 * @apiGroup Transaction
	 *
	 * @apiParam {String} name
	 * @apiParam {Number} offset=0 The number of weeks to be offset from current
	 *                    week. To view tansactions in past weeks, use negative
	 *                    number
	 */
	app.get('/accounts/:name/weekly/:offset', route(transactions.showWeekly));
};
