/**
 * Deriv API Service
 * Handles WebSocket connections to Deriv API for real-time trading
 * CRITICAL FOR REAL TRADING
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');
const { Account } = require('../models');

class DerivApiService {
  static wsInstance = null;
  static messageId = 1;

  /**
   * Connect to Deriv API
   */
  static connect() {
    return new Promise((resolve, reject) => {
      try {
        this.wsInstance = new WebSocket(process.env.DERIV_API_URL);

        this.wsInstance.onopen = () => {
          logger.info('✅ Connected to Deriv API');
          resolve(this.wsInstance);
        };

        this.wsInstance.onerror = (error) => {
          logger.error('❌ Deriv API connection error', { error: error.message });
          reject(error);
        };

        this.wsInstance.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.wsInstance.onclose = () => {
          logger.warn('Deriv API connection closed. Attempting to reconnect...');
          setTimeout(() => this.connect(), 5000);
        };
      } catch (error) {
        logger.error('Failed to connect to Deriv API', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Send request to Deriv API
   */
  static sendRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.wsInstance || this.wsInstance.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to Deriv API'));
      }

      const messageId = this.messageId++;
      const payload = {
        ...request,
        req_id: messageId
      };

      try {
        this.wsInstance.send(JSON.stringify(payload));

        // Listen for response with matching req_id
        const onMessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.req_id === messageId) {
            this.wsInstance.removeEventListener('message', onMessage);
            if (data.error) {
              reject(new Error(data.error.message));
            } else {
              resolve(data);
            }
          }
        };

        this.wsInstance.addEventListener('message', onMessage);

        // Timeout after 30 seconds
        setTimeout(() => {
          this.wsInstance.removeEventListener('message', onMessage);
          reject(new Error('Request timeout'));
        }, 30000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get account balance
   */
  static async getBalance(token) {
    try {
      const response = await this.sendRequest({
        authorize: token
      });

      logger.info('✅ Balance retrieved', { balance: response.authorize.balance });
      return response.authorize;
    } catch (error) {
      logger.error('Failed to get balance', { error: error.message });
      throw error;
    }
  }

  /**
   * Get tick prices (live market data)
   */
  static async getTickPrices(symbol) {
    try {
      const response = await this.sendRequest({
        ticks: symbol,
        subscribe: 1
      });

      return response.tick;
    } catch (error) {
      logger.error('Failed to get tick prices', { error: error.message });
      throw error;
    }
  }

  /**
   * Buy contract
   */
  static async buyContract(proposal) {
    try {
      const response = await this.sendRequest({
        buy: proposal.id,
        price: proposal.ask_price
      });

      logger.info('✅ Contract purchased', { contractId: response.buy.contract_id });
      return response.buy;
    } catch (error) {
      logger.error('Failed to buy contract', { error: error.message });
      throw error;
    }
  }

  /**
   * Close position
   */
  static async closePosition(contractId) {
    try {
      const response = await this.sendRequest({
        sell: contractId,
        price: 0 // Let Deriv set the price
      });

      logger.info('✅ Position closed', { contractId });
      return response.sell;
    } catch (error) {
      logger.error('Failed to close position', { error: error.message });
      throw error;
    }
  }

  /**
   * Get contract proposal (pre-trading data)
   */
  static async getProposal(proposal) {
    try {
      const response = await this.sendRequest(proposal);
      return response.proposal;
    } catch (error) {
      logger.error('Failed to get proposal', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle incoming messages
   */
  static handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      if (message.tick) {
        // Real-time tick data
        logger.debug('Tick data received', { symbol: message.tick.symbol, price: message.tick.quote });
      } else if (message.balance) {
        // Balance update
        logger.debug('Balance update', { balance: message.balance });
      } else if (message.proposal) {
        // Proposal data
        logger.debug('Proposal received', { proposalId: message.proposal.id });
      }
    } catch (error) {
      logger.warn('Failed to parse message', { error: error.message });
    }
  }

  /**
   * Subscribe to live prices
   */
  static async subscribePrices(symbols) {
    try {
      const promises = symbols.map(symbol =>
        this.sendRequest({
          ticks: symbol,
          subscribe: 1
        })
      );

      await Promise.all(promises);
      logger.info('✅ Subscribed to live prices', { symbols });
    } catch (error) {
      logger.error('Failed to subscribe to prices', { error: error.message });
      throw error;
    }
  }

  /**
   * Disconnect from Deriv API
   */
  static disconnect() {
    if (this.wsInstance) {
      this.wsInstance.close();
      logger.info('Disconnected from Deriv API');
    }
  }
}

module.exports = DerivApiService;
