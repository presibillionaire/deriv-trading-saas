const WebSocket = require('ws');
const logger = require('../utils/logger');

class DerivService {
  constructor() {
    this.baseUrl = 'wss://ws.binaryws.com/websockets/v3?app_id=1089'; // 1089 is a default test App ID
  }

  /**
   * Helper to handle the WebSocket lifecycle for a single request
   */
  async sendRequest(requestData) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.baseUrl);

      ws.on('open', () => {
        logger.info(`Sending request to Deriv: ${Object.keys(requestData)[0]}`);
        ws.send(JSON.stringify(requestData));
      });

      ws.on('message', (data) => {
        const response = JSON.parse(data);
        ws.close();

        if (response.error) {
          logger.error(`Deriv API Error: ${response.error.message}`);
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket Connection Error: ${error.message}`);
        reject(new Error('Failed to connect to Deriv servers'));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          reject(new Error('Deriv API request timed out'));
        }
      }, 10000);
    });
  }

  async validateToken(token) {
    try {
      const response = await this.sendRequest({ authorize: token });
      logger.info(`Token validated for user: ${response.authorize.fullname}`);
      return response.authorize; // Returns user details (balance, currency, etc.)
    } catch (error) {
      logger.error(`Token validation failed: ${error.message}`);
      throw error;
    }
  }

  async getBalance(token) {
    try {
      // We must authorize first to get balance in the same session
      // For simplicity in this helper, we use the authorize call which returns balance anyway
      const response = await this.sendRequest({ authorize: token });
      return {
        balance: response.authorize.balance,
        currency: response.authorize.currency
      };
    } catch (error) {
      logger.error(`Failed to fetch balance: ${error.message}`);
      throw error;
    }
  }

  // We will implement executeTrade once we verify the connection works!
}

module.exports = new DerivService();
