ccxt_quicker = require('./libs/ccxt_quicker');

platform = new ccxt_quicker('bittrex');

(async() => {
    console.log(platform.__isMarketsLoaded());
    console.log(await platform.loadMarkets());
    console.log(platform.__isMarketsLoaded());
    //console.log(platform);
    //console.log(platform.marketIsActive('LTC/BTC'));
})();
