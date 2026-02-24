module.exports = {
  TRADE_TYPES: {
    CALL: 'CALL',
    PUT: 'PUT',
  },
  TRADE_STATUS: {
    PENDING: 'PENDING',
    OPEN: 'OPEN',
    WON: 'WON',
    LOST: 'LOST',
    EXPIRED: 'EXPIRED',
  },
  BOT_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ERROR: 'ERROR',
  },
  DEFAULT_DURATION: 300,
  MAX_CONCURRENT_TRADES: 5,
};
