'use strict';

/*
collection_structure:
   'MARKET_ID': {    
      trades: [ {}, {}, ... ],
      info: { 
            limits: { amount: [Object], price: [Object], cost: [Object] },
            precision: { amount: 8, price: 8 },
            tierBased: false,
            percentage: true,
            taker: 0.0025,
            maker: 0.0025,
            id: 'USD-ATOM',
            symbol: 'ATOM/USD',
            base: 'ATOM',
            quote: 'USD',
            baseId: 'ATOM',
            quoteId: 'USD',
            active: true,
            info: {
                  symbol: 'ATOM-USD',
                  baseCurrencySymbol: 'ATOM',
                  quoteCurrencySymbol: 'USD',
                  minTradeSize: '0.50000000',
                  precision: 8,
                  status: 'ONLINE',
                  createdAt: '2020-01-21T18:08:40.44Z'
            }
       },
       price: {
              symbol: 'EOS/USDT',
              timestamp: 1580227815107,
              datetime: '2020-01-28T16:10:15.107Z',
              high: 4.12400452,
              low: 3.962,
              bid: 3.96040792,
              bidVolume: undefined,
              ask: 3.98438314,
              askVolume: undefined,
              vwap: undefined,
              open: 3.9767844,
              close: 3.962,
              last: 3.962,
              previousClose: undefined,
              change: -0.01478439999999992,
              percentage: -0.3717677025689379,
              average: undefined,
              baseVolume: 10418.14803144,
              quoteVolume: 41833.99800414,
              info: {
                    MarketName: 'USDT-EOS',
                    High: 4.12400452,
                    Low: 3.962,
                    Volume: 10418.14803144,
                    Last: 3.962,
                    BaseVolume: 41833.99800414,
                    TimeStamp: '2020-01-28T16:10:15.107',
                    Bid: 3.96040792,
                    Ask: 3.98438314,
                    OpenBuyOrders: 72,
                    OpenSellOrders: 50,
                    PrevDay: 3.9767844,
                    Created: '2019-07-03T04:37:01.567'
              }
       },
       OHLCV: [ [], [], [], ... ],
   }
*/

module.exports = class ccxt_quicker {
    constructor(__exchange_id, __params = { 'verbose': false }) {
        this.ccxt = require('ccxt');
        this.time_tools = require('./time_tools.js');
        //this.easy_mongo = require('./easy_mongo.js');
        //this.easy_db    = new this.easy_mongo('mongodb://localhost:27017/' + __exchange_id);
        this.tt         = new this.time_tools();
        this.__exchange = new this.ccxt[__exchange_id](__params);
        this.__exchange.markets_is_loaded = { markets_loaded: false };
        (async() => {
            this.__marketslist  = await this.getMarketsList();
            this.__marketscount = await this.__marketslist.length;
            this.__ratelimit    = await this.__exchange.rateLimit;
            this.__exchangeid   = await this.__exchange.id;
            this.__exchangename = await this.__exchange.name;
            this.__symbols      = await this.__exchange.symbols;
            this.__currencies   = await this.__exchange.currencies;
            this.__markets      = await this.loadMarkets();
/*            this.db_connecting  = await this.easy_db.connect().then((result) => {
               console.log('[' + this.tt.date_time_epoch_ms() + '] Connected to database ' + __exchange_id);
            }).catch((err) => {
               console.log('MONGODB DATA BASE ERROR ...');
               console.log(err);
            }); */
        })();
    }

    has(__what_has) {
        if (this.__exchange.has[__what_has] === undefined) {
            return undefined;
        }
        return this.__exchange.has[__what_has];
    }

    getRateLimit() {
        return this.__exchange.rateLimit;
    }

    getPeriods() {
        if (this.__exchange.timeframes === undefined) {
            return undefined;
        }
        return this.__exchange.timeframes;
    }

    getPeriodsKeys() {
        if (this.__exchange.timeframes === undefined) {
            return [];
        }
        return Object.keys(this.__exchange.timeframes);
    }

    __isMarketsLoaded() {
        return this.__exchange.markets_is_loaded;
    }

    __marketsIsLoaded() {
        this.__exchange.markets_is_loaded = { markets_loaded: true, timestamp: this.tt.date_time_epoch_ms() };
    }

    async marketIsActive(__market) {
        let marketIsActive = false;
        (async() => {
            if (this.__isMarketsLoaded().markets_loaded === false) {
                await this.loadMarkets();
                console.log(this.__exchange);
            }
            if (this.__exchange.markets[__market] !== undefined) {
                return this.__exchange.markets[__market].active;
            }
            return false;
        })();
    }

    async marketIsOnline(__market) {
        return new Promise((resolve, reject) => {
            (async() => {
            })();
        });
    }

    async getMarket(__market) {
        return new Promise((resolve, reject) => {
            if (this.__exchange.markets[__market] === undefined) {
                reject(undefined);
            }
            resolve(this.__exchange.markets[__market]);
        });
    }

    async getMarketsList() {
        return new Promise((resolve, reject) => {
            (async() => {
                try {
                    let markets_list = await this.__exchange.loadMarkets();
                    let list = [];
                    for (let symbol in markets_list) {
                        list.push(symbol);
                    }
                    this.__exchange.markets_list = list;
                    resolve(list);
                } catch (err) {
                    reject(err);
                }
            })();
        });
    }

    async loadMarkets() {
        return new Promise((resolve, reject) => {
            try {
                let markets = this.__exchange.loadMarkets();
                //this.__exchange.markets_is_loaded = { markets_loaded: true, timestamp: this.tt.date_time_epoch_ms() };
                this.__marketsIsLoaded();
                this.__exchange.markets = markets;
                resolve(markets);
            } catch (err) {
                reject(err);
            }
        });
    }

    async icosPrices() {
        return new Promise((resolve, reject) => {
            try {
                let prices = this.__exchange.fetchTickers();
                resolve(prices);
            } catch (err) {
                reject(err);
            }
        });
    }

    // price_currency get currency prices by symbol
    async icoPrice(__symbol) {
        return new Promise((resolve, reject) => {
            try {
                let prices = this.__exchange.fetchTicker(__symbol);
                resolve(prices);
            } catch (err) {
                reject(err);
            }
        });
    }

    // OHLCV Candlestick Charts
    async icoOHLCV(__symbol, __timeframe = undefined) {
        return new Promise((resolve, reject) => {
            if (this.__exchange.hasFetchOHLCV) {
                try {
                    let OHLCV = this.__exchange.fetchOHLCV(__symbol, __timeframe);
                    resolve(OHLCV);
                } catch (err) {
                    reject(err);
                }
            } else {
                console.err(this.__exchange.id + ' not have OHLCV');
                reject('Error ' + this.__exchange.id + ' : OHLCV not available');
            }
        });
    }

    async icoTrades(__symbol) {
        return new Promise((resolve, reject) => {
            try {
                let trades = this.__exchange.fetchTrades(__symbol);
                resolve(trades);
            } catch (err) {
                reject(err);
            }
        });
    }

    async icoOrderBook(__symbol) {
        return new Promise((resolve, reject) => {
            try {
                let orderbook = this.__exchange.fetchOrderBook(__symbol);
                resolve(orderbook);
            } catch (err) {
                reject(err);
            }
        });
    }
}



/* Error:
[1508064079916] (T)  collecting trade for pair BAY/BTC on the exchange bittrex
TypeError: Cannot convert undefined or null to object
    at Function.values (<anonymous>)
    at Exchange.parseTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:885:23)
    at Exchange.fetchTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:6178:21)
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:188:7)
(node:13980) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot convert undefined or null to object
(node:13980) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
^C

================
Verbose:
[1508079405373] (T)  collecting trade for pair BAY/BTC on the exchange bittrex
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTS
Request:
 { 'User-Agent': 'ccxt/1.9.74 (+https://github.com/kroitor/ccxt) Node.js/8.6.0 (JavaScript)' } undefined
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTS
Response:
{"success":true,"message":"","result":null}
TypeError: Cannot convert undefined or null to object
    at Function.values (<anonymous>)
    at Exchange.parseTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:885:23)
    at Exchange.fetchTrades (C:\Virtualenv\nodejs\crypto\crypto-collector\node_modules\ccxt\ccxt.js:6178:21)
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:188:7)
(node:11188) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot convert undefined or null to object
(node:11188) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

Resolved:
 * async fetchTrades(symbol, params = {}) {}
 * check the line 6178 for more details
 * 
 * Result:
[1508080775534] (T)  collecting trade for pair XLM/BTC on the exchange bittrex
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTA
Request:
 { 'User-Agent': 'ccxt/1.9.74 (+https://github.com/kroitor/ccxt) Node.js/8.6.0 (JavaScript)' } undefined
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-BTA
Response:
{"success":true,"message":"","result":null}
[1508080777353] (T)  collecting trade for pair BTA/BTC on the exchange bittrex
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=USDT-BTC
Request:
 { 'User-Agent': 'ccxt/1.9.74 (+https://github.com/kroitor/ccxt) Node.js/8.6.0 (JavaScript)' } undefined
bittrex GET https://bittrex.com/api/v1.1/public/getmarkethistory?market=USDT-BTC
Response:
{"success":true,"message":"","result":[{"Id":19950453,"TimeStamp":"2017-10-15T15:19:14.653","Quantity":0.02064490,"P
*/


