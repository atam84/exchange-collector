ccxt_quicker = require('./libs/ccxt_quicker');
easy_mongo   = require('./libs/easy_mongo.js');
time_tools   = require('./libs/time_tools.js');

database = 'crypto';
icoList = [ 'EOS/USDT', 'EOS/BTC', 'BTC/USDT', 'ETH/BTC', 'ETH/USDT' ];

(async() => {
    crypto_platform = 'bittrex';
    time_t          = new time_tools();
    platform        = new ccxt_quicker(crypto_platform);
    easy_db         = new easy_mongo('mongodb://localhost:27017/' + database);
    time_t.start_timing();
    markets         = await platform.loadMarkets();
    rateLimit       = platform.getRateLimit();

    if (platform.__isMarketsLoaded().markets_loaded === false) {
        console.err('[' + time_t.date_time_epoch_ms() + ']  Fail to load markets.');
        return false;
    }

    await easy_db.connect().then((result) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] YAHHH Connected to database ' + database);
    }).catch((err) => {
        console.err('[' + time_t.date_time_epoch_ms() + '] Database connection error !!!');
        console.err(err);
    });

    await easy_db.create_collection(crypto_platform);
    
    console.log('[' + time_t.date_time_epoch_ms() + '] Selected platform : ' + crypto_platform);
    console.log('[' + time_t.date_time_epoch_ms() + '] Using rate limit  : ' + rateLimit);
    console.log('[' + time_t.date_time_epoch_ms() + '] Markets loaded    : ' + markets.length);
    console.log('[' + time_t.date_time_epoch_ms() + '] Selected Markets  : ' + icoList.length);
    
    let data = []; 
    let __collected = {
        '_id': '',
        'market': '',
        'price': '',
        'trades': '',
        'orderbook': '',
        'info': '',
        'OHLCV': '',
    };
    for (var i=0; i<icoList.length; i++) {
        let __market = icoList[i];
        __collected = {
           '_id': '',
           'market': '',
           'price': '',
           'trades': '',
           'orderbook': '',
           'info': '',
           'OHLCV': '',
        };
        __collected._id = __market;
        __collected.market = __market;

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
        __collected.OHLCV = await platform.icoOHLCV(__market);
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Getting candles statestics');
        //console.log(__collected[__market]);
        data.push(__collected);
        __collected = {};
    }

    //console.log(data);
    for (var i=0; i<data.length; i++) {
        //console.log(data[i]);
        console.log('[' + time_t.date_time_epoch_ms() + ']      ==== Insert document into collection ' + crypto_platform);
        await easy_db.insert_doc(crypto_platform, data[i]);
        
        easy_db.updateOne(crypto_platform, { _id: data[i]._id }, data[i]).then((result) => {
            console.err('Document inserted !!!');
            console.log(result);
        }).catch((err) => {
            console.err('Error !!!');
            console.log(err);
        });
        
    }
    
    easy_db.disconnect();
    console.log(platform.__isMarketsLoaded());

    time_t.end_timing();
    time_t.timing_report();
})();



