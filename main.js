ccxt_quicker = require('./libs/ccxt_quicker');
easy_mongo   = require('./libs/easy_mongo.js');
time_tools   = require('./libs/time_tools.js');

database = 'crypto';
icoList = [ 'EOS/USDT', 'EOS/BTC', 'BTC/USDT', 'ETH/BTC', 'ETH/USDT' ];

(async() => {
    crypto_platform = 'bittrex';
    crypto_platform_ohlcv = crypto_platform + '_ohlcv';
    time_t          = new time_tools();
    platform        = new ccxt_quicker(crypto_platform);
    easy_db         = new easy_mongo('mongodb://localhost:27017/' + database);
    time_t.start_timing();
    markets         = await platform.loadMarkets();
    rateLimit       = platform.getRateLimit();

    if (platform.__isMarketsLoaded().markets_loaded === false) {
        console.log('[' + time_t.date_time_epoch_ms() + ']  Fail to load markets.');
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
    
    let data        = [];
    let ohlcv       = [];
    let __collected = {};
    let __OHLCV     = {};
    for (var i=0; i<icoList.length; i++) {
        let __market = icoList[i];
        let __ohlcv_last_time = '';
        __collected = {
           '_id': '',
           'market': '',
           'price': '',
           'trades': '',
           'orderbook': '',
           'info': '',
           'OHLCV': '',
        };
        __OHLCV = {
           '_id': '',
           'last_time': '',
           'counter': '',
           'market': '',
           'OHLCV': '',
        };
        __collected._id    = __market;
        __collected.market = __market;
        __collected.OHLCV  = __market + '_OHLCV';
        __OHLCV._id        = __collected.OHLCV;
        __OHLCV.market     = __market;

        console.log('[' + time_t.date_time_epoch_ms() + ']  *** Working on ' + __market);
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting markets info');
        __collected.info = await platform.getMarket(__market);

        await time_t.__u_sleep(rateLimit);
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting price');
        __collected.price = await platform.icoPrice(__market);

        await time_t.__u_sleep(rateLimit);
        __collected.trades = await platform.icoTrades(__market);
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting Trades');

        await time_t.__u_sleep(rateLimit);
        __collected.orderbook = await platform.icoOrderBook(__market);
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting Order book');
        
        await time_t.__u_sleep(rateLimit);
        __OHLCV.OHLCV = await platform.icoOHLCV(__market);
        try {
            __OHLCV.last_time = __OHLCV.OHLCV[__OHLCV.OHLCV.length - 1][0];
        } catch(err) {
            __OHLCV.last_time = null;
        }
        try {
            __OHLCV.counter = __OHLCV.OHLCV.length;
        } catch(err) {
            __OHLCV.counter = 0;
        }
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting candles statestics');
        //console.log(__collected[__market]);
        data.push(__collected);
        ohlcv.push(__OHLCV);
        __collected = {};
        __OHLCV = {};
    }

    //console.log(data);
    for (var i=0; i<data.length; i++) {
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Insert ico documents into collection ' + crypto_platform);
        
        await easy_db.updateOne(crypto_platform, { _id: data[i]._id }, data[i]).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']          ---- Document _id ' + data[i]._id + ' inserted !!!');
            //console.log(result);
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']          ---- Error inserting document _id ' + data[i]._id);
            console.log(err);
        });
        
    }

    for (var i=0; i<ohlcv.length; i++) {
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Insert OHLCV documents into collection ' + crypto_platform_ohlcv);

        await easy_db.updateOne(crypto_platform_ohlcv, { _id: ohlcv[i]._id }, ohlcv[i]).then((result) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']          ---- Document OHLCV _id ' + ohlcv[i]._id + ' inserted !!!');
            //console.log(result);
        }).catch((err) => {
            console.log('[' + time_t.date_time_epoch_ms() + ']          ---- Error inserting document _id ' + ohlcv[i]._id);
            console.log(err);
        });
    }
    
    easy_db.disconnect();
    console.log(platform.__isMarketsLoaded());

    time_t.end_timing();
    time_t.timing_report();
})();



