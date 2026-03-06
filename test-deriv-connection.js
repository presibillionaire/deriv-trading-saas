// test-deriv-connection.js

require('dotenv').config();
const axios = require('axios');

const DERIV_API_URL = 'https://api.deriv.com/v1/';
const accountType = process.env.DERIV_ACCOUNT_TYPE || 'demo'; // 'real' or 'demo'
const appId = process.env.DERIV_APP_ID;

if (!appId) {
    console.error('Missing DERIV_APP_ID in environment variables.');
    process.exit(1);
}

const validateConnection = async () => {
    try {
        const response = await axios.get(`${DERIV_API_URL}ping`);
        console.log('Connection validated:', response.data);
    } catch (error) {
        console.error('Error validating connection:', error.message);
    }
};

const getLiveMarketData = async () => {
    try {
        const response = await axios.get(`${DERIV_API_URL}ticks`, {
            headers: { 'X-Deriv-Application-Id': appId },
        });
        console.log('Live market data:', response.data);
    } catch (error) {
        console.error('Error fetching live market data:', error.message);
    }
};

const placeTestTrade = async () => {
    try {
        const tradeData = {
            // Sample trade data structure, needs to be tailored to the specific API requirements
            action: 'buy',
            amount: 1,
            symbol: 'R_100',
            duration: 60,
            price: 10,
        };

        const response = await axios.post(`${DERIV_API_URL}trade`, tradeData, {
            headers: { 'X-Deriv-Application-Id': appId },
        });
        console.log('Test trade placed:', response.data);
    } catch (error) {
        console.error('Error placing test trade:', error.message);
    }
};

const runTests = async () => {
    await validateConnection();
    await getLiveMarketData();
    await placeTestTrade();
};

runTests();
