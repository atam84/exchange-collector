ccxt_quicker = require('./libs/ccxt_quicker');
easy_mongo   = require('./libs/easy_mongo.js');
time_tools   = require('./libs/time_tools.js');

database = 'crypto';
icoList = [ 'EOS/USDT', 'EOS/BTC']; //, 'BTC/USDT', 'ETH/BTC', 'ETH/USDT' ];

function Log(Message, printLog = true) {
    if(printLog === true) {
        process.stdout.write(Message);
    }
}

async function getLastTimeOHLCV(__collection, __id) {
    return new Promise((resolve, reject) => {
        (async() => {
            last_time = await easy_db.findOne(__collection, {_id: __id}, { projection: { _id: 0, last_time: 1 } });
            if (last_time === null) {
                resolve(undefined);
            } else { 
                if (last_time.last_time !== undefined) {
                    resolve(last_time.last_time);
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
                    console.log(' -- ' + err);
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

(async() => {
    crypto_platform       = 'bittrex';
    crypto_platform_ohlcv = crypto_platform + '_ohlcv';
    time_t                = new time_tools();
    platform              = new ccxt_quicker(crypto_platform);
    easy_db               = new easy_mongo('mongodb://localhost:27017/', database, { verbose: false });
    markets               = await platform.loadMarkets();
    rateLimit             = platform.getRateLimit();
    time_t.start_timing();

    if (platform.__isMarketsLoaded().markets_loaded === false) {
        console.log('[' + time_t.date_time_epoch_ms() + '] Fail to load markets.');
        return false;
    }

    await easy_db.connect().then((result) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] YAHHH Connected to database ' + database);
    }).catch((err) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] Database connection error !!!');
        console.log(err);
    });

    await easy_db.create_collection(crypto_platform);
    await easy_db.create_collection(crypto_platform_ohlcv);
    
    console.log('[' + time_t.date_time_epoch_ms() + '] Selected platform : ' + crypto_platform);
    console.log('[' + time_t.date_time_epoch_ms() + '] Using rate limit  : ' + rateLimit);
    console.log('[' + time_t.date_time_epoch_ms() + '] Markets loaded    : ' + markets.length);
    console.log('[' + time_t.date_time_epoch_ms() + '] Selected Markets  : ' + icoList.length);
    
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
        };
        candle = {
            '__OHLCV': {
                '_id': '',
                'last_time': '',
                'counter': '',
                'market': '',
            },
            'OHLCV': ''
        }

        pulling_data = {
            'market_info': false,
            'ico_price': false,
            'ico_trades': false,
            'ico_orderbook': false,
            'ico_ohlcv': false
        };
        __collected._id    = __market;
        __collected.market = __market;
        __collected.OHLCV  = __market + '_OHLCV';
        candle.__OHLCV._id        = __collected.OHLCV;
        candle.__OHLCV.market     = __market;
        
        console.log('[' + time_t.date_time_epoch_ms() + ']  *** Working on ' + __market);

        __collected.info = await marketInfo('getMarket', __market, {
           'logMessage': true,
           'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' market information     ',
           'success': 'Success\n',
           'failure': 'Fail\n'
        }, 3, rateLimit);
        if(__collected.info !== undefined) {
            pulling_data.market_info = true;
        }
        
        if (pulling_data.market_info) {
            //await time_t.__u_sleep(rateLimit);
            //console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting price');
            //__collected.price = await platform.icoPrice(__market);
            __collected.price = await marketInfo('icoPrice', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' price                  ',
               'success': 'Success\n',
               'failure': 'Fail\n'
            }, 3, rateLimit).catch((err) => { console.log('DONT CONTINUE');});
            if(__collected.price !== undefined) {
                pulling_data.ico_price = true;
            }

            //await time_t.__u_sleep(rateLimit);
            //__collected.trades = await platform.icoTrades(__market);
            //console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting Trades');
            __collected.trades = await marketInfo('icoTrades', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' trades                 ',
               'success': 'Success\n',
               'failure': 'Fail\n'
            }, 3, rateLimit);
            if(__collected.trades !== undefined) {
                pulling_data.ico_trades = true;
            }

            //await time_t.__u_sleep(rateLimit);
            //__collected.orderbook = await platform.icoOrderBook(__market);
            //console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting Order book');
            __collected.orderbook = await marketInfo('icoOrderBook', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' order book             ',
               'success': 'Success\n',
               'failure': 'Fail\n'
            }, 3, rateLimit);
            if(__collected.orderbook !== undefined) {
                pulling_data.ico_orderbook = true;
            }

            //await time_t.__u_sleep(rateLimit);
            //__OHLCV.OHLCV = await platform.icoOHLCV(__market);
            __last_time = await getLastTimeOHLCV(crypto_platform_ohlcv, __market + '_OHLCV');
            Log('[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' candles statistics data from ' + __last_time + '\n');
            candle.OHLCV = await marketInfo('icoOHLCV', __market, {
               'logMessage': true,
               'mainMessage': '[' + time_t.date_time_epoch_ms() + ']  > Get ' + __market + ' candles statistics     ',
               'success': 'Success\n',
               'failure': 'Fail\n',
               'last_time': __last_time
            }, 3, rateLimit);

            if(candle.OHLCV !== undefined) {
                pulling_data.ico_ohlcv = true;
            }

            try {
                candle.__OHLCV.last_time = candle.OHLCV[candle.OHLCV.length - 1][0];
            } catch(err) {
                candle.__OHLCV.last_time = null;
            }
            try {
                candle.__OHLCV.counter = candle.OHLCV.length;
            } catch(err) {
                candle.__OHLCV.counter = 0;
            }
            //console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting candles statestics');
            console.log(candle);
        }
        __collected.status = pulling_data;
        data.push(__collected);
        ohlcv.push(candle);
        __collected = {};
        __OHLCV = {};
    }

    //console.log(data);
    for (var i=0; i<data.length; i++) {
        console.log('[' + time_t.date_time_epoch_ms() + '] Insert ico documents into collection ' + crypto_platform);
        
        await easy_db.updateOne(crypto_platform, { _id: data[i]._id }, data[i]).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + '] ---- Document _id ' + data[i]._id + ' inserted !!!');
            //console.log(result);
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + '] ---- Error inserting document _id ' + data[i]._id);
            console.log(err);
        });
        
    }

    for (var i=0; i<ohlcv.length; i++) {
        console.log('[' + time_t.date_time_epoch_ms() + '] ==== Insert OHLCV documents into collection ' + crypto_platform_ohlcv);

        await easy_db.updateOne(crypto_platform_ohlcv, { _id: ohlcv[i].__OHLCV._id }, ohlcv[i].__OHLCV).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + '] ---- Document OHLCV _id ' + ohlcv[i].__OHLCV._id + ' inserted !!!');
            //console.log(result);
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + '] ---- Error inserting document _id ' + ohlcv[i].__OHLCV._id);
            console.log(err);
        });

        await easy_db.pushIntoArray(crypto_platform_ohlcv, { _id: ohlcv[i].__OHLCV._id }, {'OHLCV': ohlcv[i].OHLCV}).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + '] ---- Array statistics OHLCV _id ' + ohlcv[i].__OHLCV._id + ' inserted !!!');
            //console.log(result);
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + '] ---- Error inserting Array statistics document _id ' + ohlcv[i].__OHLCV._id);
            console.log(err);
        });
    }
    
    easy_db.disconnect();
    console.log(platform.__isMarketsLoaded());

    time_t.end_timing();
    time_t.timing_report();
})();



