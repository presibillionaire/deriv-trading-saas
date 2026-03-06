const WebSocket = require('ws');
const logger = require('../utils/logger');

class DerivService {
  constructor() {
    this.baseUrl = 'wss://ws.binaryws.com/websockets/v3?app_id=127831';
  }

  /**
   * Helper to handle the WebSocket lifecycle for simple requests
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

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          reject(new Error('Deriv API request timed out'));
        }
      }, 10000);
    });
  }

  async validateToken(token) {
    const response = await this.sendRequest({ authorize: token });
    return response.authorize;
  }

  async getBalance(token) {
    const response = await this.sendRequest({ authorize: token });
    return {
      balance: response.authorize.balance,
      currency: response.authorize.currency
    };
  }

  /**
   * Executes a trade (Authorize -> Buy flow)
   */
  async executeTrade(token, tradeParams) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.baseUrl);

      ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: token }));
      });

      ws.on('message', (data) => {
        const response = JSON.parse(data);

        if (response.error) {
          ws.close();
          return reject(new Error(response.error.message));
        }

        if (response.msg_type === 'authorize') {
          ws.send(JSON.stringify({
            buy: 1,
            price: tradeParams.amount,
            parameters: {
              amount: tradeParams.amount,
              basis: 'stake',
              contract_type: tradeParams.contract_type,
              currency: response.authorize.currency || 'USD',
              duration: tradeParams.duration,
              duration_unit: tradeParams.duration_unit,
              symbol: tradeParams.symbol
            }
          }));
        }

        if (response.msg_type === 'buy') {
          ws.close();
          resolve({
            contract_id: response.buy.contract_id,
            purchase_price: response.buy.buy_price,
            balance_after: response.buy.balance_after
          });
        }
      });

      ws.on('error', (error) => {
        ws.close();
        reject(error);
      });

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          reject(new Error('Trade timed out'));
        }
      }, 20000);
    });
  }

  /**
   * Fetches the final outcome of a contract
   * FIX: Uses sequential messaging (Authorize THEN Request)
   */
  async getContractStatus(token, contractId) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.baseUrl);

      ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: token }));
      });

      ws.on('message', (data) => {
        const response = JSON.parse(data);

        if (response.error) {
          ws.close();
          return reject(new Error(response.error.message));
        }

        // Step 1: Once authorized, request the contract details
        if (response.msg_type === 'authorize') {
          ws.send(JSON.stringify({
            proposal_open_contract: 1,
            contract_id: parseInt(contractId)
          }));
        }

        // Step 2: Receive the contract data
        if (response.msg_type === 'proposal_open_contract') {
          const contract = response.proposal_open_contract;
          ws.close();
          
          resolve({
            is_sold: !!contract.is_sold,
            status: contract.status, // 'won' or 'lost'
            profit: contract.profit,
            exitPrice: contract.exit_tick_display_value || contract.sell_price,
            payout: contract.payout
          });
        }
      });

      ws.on('error', (error) => {
        ws.close();
        reject(error);
      });

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          reject(new Error('Contract check timed out'));
        }
      }, 15000);
    });
  }
}

module.exports = new DerivService();
