'use strict';

var DB = require('../db'),
  moment = require('moment-timezone');

exports.week = function (params) {
  // get the week offset
  var offset = (+params.offset) * 7;
  // if going back in time
  if (!params.forward) {
    offset = -offset;
  }

  // transactions are bound from this monday to before next monday
  var thisMonday = moment().day(1 + offset).toDate();
  var nextMonday = moment().day(8 + offset).toDate();

  return DB.collection(params.name).find({date: {$gte: thisMonday, $lt: nextMonday}}).sort({date: -1});
};
