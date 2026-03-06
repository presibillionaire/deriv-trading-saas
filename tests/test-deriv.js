const WebSocket = require('ws');
require('dotenv').config();

const APP_ID = process.env.DERIV_APP_ID || 1089; // Default 1089 is for testing
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

ws.on('open', function open() {
    console.log('✨ Connected to Deriv WebSocket');
    
    // Send a request for live ticks on Volatility 100 Index
    ws.send(JSON.stringify({ 
        ticks: 'R_100',
        subscribe: 1 
    }));
});

ws.on('message', function incoming(data) {
    const response = JSON.parse(data);
    
    if (response.error) {
        console.error('❌ Deriv Error:', response.error.message);
        process.exit(1);
    }

    if (response.tick) {
        console.log('✅ Live Tick Received:', response.tick.quote);
        // We got a tick! Success. Close connection.
        ws.close();
        process.exit(0);
    }
});

ws.on('error', function error(err) {
    console.error('❌ Connection Error:', err.message);
});
