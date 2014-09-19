'use strict';

exports.route = function (req, res, next, controller) {
  return controller(req.params).then(function (result) {
    res.json(result);
    return next();
  }, function (err) {
    console.err(err);
    return next(err);
  });
};