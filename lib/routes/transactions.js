'use strict';

var Router = require('../router.js');
var ObjectId = require('mongod').ObjectId;
var transactions = require('../controllers/transactions.js');

var accountNameError = new Error('Account name is required');
var objectIdError = new Error('ObjectId is not valid');

module.exports = function (server) {
	server.get('/accounts/:name/transactions', function (req, res, next) {
		if (!req.params.name) {
			return next(accountNameError);
		}
		Router.route(req, res, next, transactions.showAll);
	});

	// @param date Date
	// @param amount Double
	// @param description Stringa
	// @param category String
	server.post('/accounts/:name/transactions', function (req, res, next) {
		if (!req.params.name) {
			return next(accountNameError);
		}
		Router.route(req, res, next, transactions.newTransaction);
	});

	server.get('/accounts/:name/transactions/:_id', function (req, res, next) {
		if (!req.params.name) {
			return next(accountNameError);
		}
		if (!ObjectId.isValid(req.params._id)) {
			throw objectIdError;
		}
		Router.route(req, res, next, transactions.showOne);
	});

	// @param date Date
	// @param amount Double
	// @param description String
	// @param category String
	server.patch('/accounts/:name/transactions/:_id', function (req, res, next) {
		if (!req.params.name) {
			return next(accountNameError);
		}
		if (!ObjectId.isValid(req.params._id)) {
			throw objectIdError;
		}
		Router.route(req, res, next, transactions.updateTransaction);
	});

	server.del('/accounts/:name/transactions/:_id', function (req, res, next) {
		if (!req.params.name) {
			return next(accountNameError);
		}
		if (!ObjectId.isValid(req.params._id)) {
			throw objectIdError;
		}
		Router.route(req, res, next, transactions.deleteTransaction);
	});
};
