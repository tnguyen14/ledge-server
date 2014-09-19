'use strict';

exports.route = function (req, res, next, controller) {
  return controller(req.params).done(function (result) {
    res.json(result);
    return next();
  }, function (err) {
    console.log(err);
    return next(err);
  });
};