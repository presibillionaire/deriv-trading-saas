'use strict';

const WebSocket = require('ws');
const winston = require('winston'); // For logging

// Configure winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

class DerivAPIClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3');
            
            this.ws.on('open', () => {
                this.isConnected = true;
                logger.info('WebSocket connection established.');
                resolve();
            });
            
            this.ws.on('error', (error) => {
                logger.error(`WebSocket error: ${error.message}`);
                this.isConnected = false;
                reject(error);
            });
            
            this.ws.on('close', () => {
                logger.warn('WebSocket connection closed.');
                this.isConnected = false;
            });
        });
    }

    getTicks(symbol) {
        this.sendRequest({
            ticks: symbol
        });
    }

    generateSignal(ticks) {
        // Implement signal generation logic based on ticks
        // Example: if the latest tick is higher than the previous, send a buy signal
        // This is a placeholder for actual signal logic
        logger.info('Generating signal based on received ticks.');
    }

    placeTestTrade(symbol, amount, direction) {
        this.sendRequest({
            buy: symbol,
            amount: amount,
            direction: direction
        });
    }

    sendRequest(request) {
        if (this.isConnected) {
            this.ws.send(JSON.stringify(request), (error) => {
                if (error) {
                    logger.error(`Error sending request: ${error.message}`);
                }
            });
            logger.info(`Request sent: ${JSON.stringify(request)}`);
        } else {
            logger.warn('Cannot send request, WebSocket is not connected.');
        }
    }

    disconnect() {
        if (this.isConnected) {
            this.ws.close();
            logger.info('Disconnected from WebSocket.');
        } else {
            logger.warn('WebSocket is already closed.');
        }
    }
}

module.exports = DerivAPIClient;
