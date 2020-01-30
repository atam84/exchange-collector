easy_mongo   = require('./libs/easy_mongo.js');
time_tools   = require('./libs/time_tools.js');

database = 'crypto';
icoList = [ 'EOS/USDT', 'EOS/BTC', 'BTC/USDT', 'ETH/BTC', 'ETH/USDT' ];

async function push_data() {
    return new Promise((resolve, reject) => {
        let __collected = {
            '_id': '',
            'market': '',
            'price': '',
            'trades': '',
            'orderbook': '',
            'info': '',
            'OHLCV': '',
        };
        (async() => {
            for(var i=0; i<255; i++) {
                __collected._id = i+21415;
                await easy_db.insert_doc(crypto_platform, __collected);
                //await time_t.__u_sleep(10);
            }
            resolve(true);
        })();
    });
}

(async() => {
    crypto_platform = 'bittrex';
    time_t          = new time_tools();

    easy_db         = new easy_mongo('mongodb://localhost:27017/', database);
    time_t.start_timing();


    await easy_db.connect().then((result) => {
        console.log('[' + time_t.date_time_epoch_ms() + '] YAHHH Connected to database ' + database);
    }).catch((err) => {
        console.err('[' + time_t.date_time_epoch_ms() + '] Database connection error !!!');
        console.err(err);
    });

    await easy_db.drop_collection(crypto_platform);
    await easy_db.create_collection(crypto_platform);
    
    
    await push_data();
    
    
    await easy_db.disconnect();

    time_t.end_timing();
    time_t.timing_report();
})();



