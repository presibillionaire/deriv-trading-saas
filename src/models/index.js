const User = require('./User');
const APIToken = require('./APIToken');
const BotConfig = require('./BotConfig');
const InviteLink = require('./InviteLink');
const Strategy = require('./Strategy');
const TradeHistory = require('./TradeHistory');

// In MongoDB/Mongoose, associations are usually handled via 
// 'ref' inside the individual model files rather than here.

module.exports = {
  User,
  APIToken,
  BotConfig,
  InviteLink,
  Strategy,
  TradeHistory,
};
