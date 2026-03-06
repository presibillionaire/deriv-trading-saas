// PRIORITY: Create this file to test Deriv API connection

const WebSocket = require('ws');
const dotenv = require('dotenv');
dotenv.config();

class DerivAPIClient {
  constructor() {
    this.ws = null;
    this.requestId = 1;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(process.env.DERIV_API_URL);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to Deriv API');
        resolve();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ Deriv API Connection Error:', error);
        reject(error);
      };
      
      this.ws.onmessage = (event) => {
        console.log('📨 Deriv API Response:', JSON.parse(event.data));
      };
    });
  }

  // Test: Get live ticks
  async getTicks(symbol = '1HZ100V') {
    const payload = {
      ticks: symbol,
      req_id: this.requestId++
    };
    this.ws.send(JSON.stringify(payload));
  }

  // Test: Place demo trade
  async placeTrade(token, symbol, duration, amount = 10) {
    const payload = {
      buy: 1,
      subscribe: 1,
      price: amount,
      parameters: {
        contract_type: 'CALL',
        currency: 'USD',
        duration: duration,
        duration_unit: 'm',
        symbol: symbol
      },
      req_id: this.requestId++,
      token: token
    };
    this.ws.send(JSON.stringify(payload));
  }
}

module.exports = DerivAPIClient;
