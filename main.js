#!/usr/bin/env node

const ccxt_quicker = require('./libs/ccxt_quicker');
const easy_mongo   = require('./libs/easy_mongo.js');
const time_tools   = require('./libs/time_tools.js');
const __argv       = require('yargs').argv;

//database = 'crypto';
//icoList = [ 'EOS/USDT', 'EOS/BTC']; //, 'BTC/USDT', 'ETH/BTC', 'ETH/USDT' ];

function Log(Message, printLog = true) {
    if(printLog === true) {
        process.stdout.write(Message);
    }
}

async function getUsedTimeFrame(__collection, __id) {
    return new Promise((resolve, reject) => {
        (async() => {
            var _p = await easy_db.findOne(__collection, {_id: __id}, { projection: { _id: 0, period: 1 } });
            if (_p.period === null || _p.period === '') {
                resolve(undefined);
            } else {
                resolve(_p.period);
            }
            resolve(undefined);
        })();
    });
}


async function getCounterOHLCV(__collection, __id) {
    return new Promise((resolve, reject) => {
        (async() => {
            var _c = await easy_db.findOne(__collection, {_id: __id}, { projection: { _id: 0, counter: 1 } });
            if (_c.counter === null || _c.counter === '' || _c.counter === undefined) {
                resolve(0);
            } else {
                if (_c.counter !== 0) {
                    resolve(_c.counter);
                }
            }
            resolve(0);
        })();
    });
}

async function getLastTimeOHLCV(__collection, __id) {
    return new Promise((resolve, reject) => {
        (async() => {
            var _l = await easy_db.findOne(__collection, {_id: __id}, { projection: { _id: 0, last_time: 1 } });
            if (_l.last_time === null || _l.last_time === '') {
                resolve(undefined);
            } else { 
                if (_l.last_time !== undefined) {
                    resolve(_l.last_time);
                }
            }
            resolve(undefined);
        })();
    });
}

function marketInfo(__action, __market, options = { 'logMessage': true, 'mainMessage': '', 'success': 'Success', 'failure': 'Fail', 'period': '1m'}, retry = 3, rateLimit = 1500) {
    let repeater = 0;
    let info = '';
    return new Promise((resolve, reject) => { 
      (async() => {
      Log(options.mainMessage, options.logMessage);
      do {
            repeater += 1;
            try {
                //info = await platform.getMarket(__market);
                //console.log('Fired');
                //getLastTimeOHLCV(__collection, __id)
                if(__action === 'icoOHLCV') {
                    info = await platform[__action](__market, options.period, options.last_time);
                } else {
                    info = await platform[__action](__market);
                }
                
                Log(options.success, options.logMessage);
                await time_t.__u_sleep(rateLimit);
                repeater = retry + 1;
                resolve(info);
            } catch(err) {
                Log(options.failure + ' retry attempt: ' + repeater, options.logMessage);
                if(options.logMessage) {
                    console.log(' -- Error ' + err);
                }
                await time_t.__u_sleep(rateLimit * repeater);
                //continue;
                if(repeater >= retry) {
                    resolve(undefined);
                }
            }
      } while(repeater < retry);
      resolve(undefined);
      })();
    });
}

function selectSmallerPeriod(__periodKeys, __prefered = '5m') {
    /* { '1m': 'oneMin','5m': 'fiveMin','30m': 'thirtyMin','1h': 'hour','1d': 'day' } */
    var periods = [ '1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d' ];
    if (__periodKeys.indexOf(__prefered) > -1) {
        return __prefered;
    }
    for (var i=0; i<periods.length; i++) {
        if(__periodKeys.indexOf(periods[i]) > -1) {
            return periods[i];
        }
    }
    return undefined;
}

/*
console.log(__argv);
if(__argv.help) {
    console.log('');
    console.log('Arguments:                                                                          ');
    console.log('  --exchange=EXCHANGE_ID                       e.g: --exchange=bittrex              ');
    console.log('  --database=MONGO_DB_NAME                     default: crypto                      ');
    console.log('  --ico-pair=ICO_MARKET_1,ICO_MARKET_2,...                                          ');
    console.log('  --ratelimit=RATELIMIT_IN_MILLISECEND         default: value returned by exchange  ');
    console.log('');
    process.exit(0);
}
*/


(async() => {
    let database              = 'crypto';
    let icoList               = [ 'EOS/USDT', 'EOS/BTC', 'BTC/USDT', 'ETH/BTC', 'ETH/USDT' ];
    let crypto_platform       = 'binance';
    let crypto_platform_ohlcv = crypto_platform + '_ohlcv';
    time_t                    = new time_tools();
    time_t.start_timing();
    platform                  = new ccxt_quicker(crypto_platform);
    easy_db                   = new easy_mongo('mongodb://localhost:27017/', database, { verbose: false });
    rateLimit                 = platform.getRateLimit();
    markets                   = await platform.loadMarkets();
    await time_t.__u_sleep(rateLimit);
    markets_list              = Object.keys(markets);
    platform_periods          = platform.getPeriodsKeys();
    __period                  = selectSmallerPeriod(platform_periods);
    await time_t.__u_sleep(rateLimit);

    if (platform.__isMarketsLoaded().markets_loaded === false) {
        console.log('[' + time_t.date_time_epoch_ms() + '] Fail to load markets.');
        return false;
    }

    await easy_db.connect().then((result) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] Connected to database ' + database + ' Success');
    }).catch((err) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] Database connection error !!!');
        console.log(err);
    });

    await easy_db.create_collection(crypto_platform);
    await easy_db.create_collection(crypto_platform_ohlcv);
    
    console.log('[' + time_t.date_time_epoch_ms() + '] Selected platform     : ' + crypto_platform);
    console.log('[' + time_t.date_time_epoch_ms() + '] Using rate limit      : ' + rateLimit);
    console.log('[' + time_t.date_time_epoch_ms() + '] Markets loaded        : ' + markets_list.length + ' markets');
    console.log('[' + time_t.date_time_epoch_ms() + '] Selected Markets      : ' + icoList.length);
    console.log('[' + time_t.date_time_epoch_ms() + '] Exchange periods      : ' + platform_periods);
    console.log('[' + time_t.date_time_epoch_ms() + '] Will use that period  : ' + __period);
    
    
    let data         = [];
    let ohlcv        = [];
    let __collected  = {};
    let __OHLCV      = {};
    let repeater     = 0;
    let pulling_data = {};
    for (var i=0; i<icoList.length; i++) {
        let __market          = icoList[i];
        let __ohlcv_last_time = '';
        __collected = {
           '_id': '',
           'status': '',
           'market': '',
           'price': '',
           'trades': '',
           'orderbook': '',
           'info': '',
           'OHLCV': '',
           'OHLCV_period': '',
           'collect_time': '',
        };
        candle = {
            '__OHLCV': {
                '_id': '',
                'last_time': '',
                'counter': '',
                'market': '',
                'period': '',
                'collect_time': ''
            },
            'OHLCV': ''
        };
        pulling_data = {
            'market_info': false,
            'ico_price': false,
            'ico_trades': false,
            'ico_orderbook': false,
            'ico_ohlcv': false
        };
        __collected._id           = __market;
        __collected.market        = __market;
        __collected.OHLCV         = __market + '_OHLCV';
        __collected.collect_time  = time_t.date_time_epoch_ms();
        candle.__OHLCV._id        = __collected.OHLCV;
        candle.__OHLCV.market     = __market;
        
        console.log('[' + time_t.date_time_epoch_ms() + '] Working on ' + __market);

        // Get market information
        __collected.info = await marketInfo('getMarket', __market, {
           'logMessage': true,
           'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' market information     ',
           'success': 'Success\n',
           'failure': 'Fail\n'
        }, 3, rateLimit);
        if(__collected.info !== undefined) {
            pulling_data.market_info = true;
        }
        
        // Collect the other data and statistics if we can get the market information 
        if (pulling_data.market_info) {
            // get market price
            __collected.price = await marketInfo('icoPrice', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' price                  ',
               'success': 'Success\n',
               'failure': 'Fail\n'
            }, 3, rateLimit).catch((err) => { console.log('DONT CONTINUE');});
            if(__collected.price !== undefined) {
                pulling_data.ico_price = true;
            }

            // get trades related to the market
            __collected.trades = await marketInfo('icoTrades', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' trades                 ',
               'success': 'Success\n',
               'failure': 'Fail\n'
            }, 3, rateLimit);
            if(__collected.trades !== undefined) {
                pulling_data.ico_trades = true;
            }

            // get orderbook related to the market
            __collected.orderbook = await marketInfo('icoOrderBook', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' order book             ',
               'success': 'Success\n',
               'failure': 'Fail\n'
            }, 3, rateLimit);
            if(__collected.orderbook !== undefined) {
                pulling_data.ico_orderbook = true;
            }

            // get last time when the candle is collected if not present __last_time = undefined
            __last_time = await getLastTimeOHLCV(crypto_platform_ohlcv, __market + '_OHLCV');
            // get counter
            __counter = await getCounterOHLCV(crypto_platform_ohlcv, __market + '_OHLCV');
            if(__counter > 0) {
                Log('[' + time_t.date_time_epoch_ms() + ']  - ' + __counter + ' candles statistics data for  ' + __market + ' already collected from the previous execution.\n');
            }
            __usedTimeFrame = await getUsedTimeFrame(crypto_platform_ohlcv, __market + '_OHLCV');
            if(__usedTimeFrame !== __period && __usedTimeFrame !== undefined && __usedTimeFrame !== '' && __usedTimeFrame !== null) {
                __period = __usedTimeFrame;
                Log('[' + time_t.date_time_epoch_ms() + ']  - (SKEEP) Will use the previous period used for ' + __market + ' candles statistics data from ' + __last_time + '  with ' + __period + ' as timeframe\n');
                __period = __usedTimeFrame;
            }
            
            Log('[' + time_t.date_time_epoch_ms() + ']  - Get ' + __market + ' candles statistics data from ' + __last_time + '  with ' + __period + ' as timeframe\n');
            // get OHLCV statistics
            candle.OHLCV = await marketInfo('icoOHLCV', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' candles statistics     ',
               'success': 'Success\n',
               'failure': 'Fail\n',
               'last_time': __last_time,
               'period': __period
            }, 3, rateLimit);
            // if we have data in database this mean the new collected candles will containe the last one collected, then we remove it
            if(__counter > 0 && __counter !== undefined) {
                candle.OHLCV.shift();
            }
            __newCandles = candle.OHLCV.length;
            __totalStatistics = __counter + __newCandles;
            Log('[' + time_t.date_time_epoch_ms() + ']  - ' + __newCandles + ' candles statistics data collected and will ne added to ' + __counter + ' already existing (' + __totalStatistics + ')\n');

            __collected.OHLCV_period    = __period;
            candle.__OHLCV.collect_time = time_t.date_time_epoch_ms();
            candle.__OHLCV.period       = __period;
            if(candle.OHLCV !== undefined) {
                pulling_data.ico_ohlcv = true;
            }

            try {
                candle.__OHLCV.last_time = candle.OHLCV[candle.OHLCV.length - 1][0];
            } catch(err) {
                candle.__OHLCV.last_time = null;
            }
            try {
                candle.__OHLCV.counter = candle.OHLCV.length + __counter;
            } catch(err) {
                candle.__OHLCV.counter = 0 + __counter;
            }
        }
        __collected.status = pulling_data;
        data.push(__collected);
        ohlcv.push(candle);
        // CleanUp __collected and candle object
        __collected = {};
        candle = {};
    }

    // Insert collected data to collection
    console.log('[' + time_t.date_time_epoch_ms() + '] Insert ico documents into collection ' + crypto_platform);
    for (var i=0; i<data.length; i++) {
        await easy_db.updateOne(crypto_platform, { _id: data[i]._id }, data[i]).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']  - Document _id ' + data[i]._id + ' inserted !!!');
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']  - Error inserting document _id ' + data[i]._id);
            console.log(err);
        });
        
    }

    // Insert OHLCV data to ohlcv collection
    console.log('[' + time_t.date_time_epoch_ms() + '] Insert OHLCV documents into collection ' + crypto_platform_ohlcv);
    for (var i=0; i<ohlcv.length; i++) {
        // update or insert global information, the counter has a bug that will be fixed 
        await easy_db.updateOne(crypto_platform_ohlcv, { _id: ohlcv[i].__OHLCV._id }, ohlcv[i].__OHLCV).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']  - Document OHLCV _id ' + ohlcv[i].__OHLCV._id + ' inserted !!!');
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']  - Error inserting document _id ' + ohlcv[i].__OHLCV._id);
            console.log(err);
        });

        // update or insert ohlcv candle data **** under test i have some issues with that, this part is important, 
        await easy_db.pushIntoArray(crypto_platform_ohlcv, { _id: ohlcv[i].__OHLCV._id }, { 'OHLCV': { $each: ohlcv[i].OHLCV } }).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']  - Array statistics OHLCV _id ' + ohlcv[i].__OHLCV._id + ' inserted !!!');
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']  - Error inserting Array statistics document _id ' + ohlcv[i].__OHLCV._id);
            console.log(err);
        });
    }
    
    easy_db.disconnect();

    time_t.end_timing();
    time_t.timing_report();
})();



