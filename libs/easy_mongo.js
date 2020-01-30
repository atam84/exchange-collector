'use strict';

module.exports = class easy_mongo {
    constructor(uri, database = 'crypto', options = { verbose: true } /*, verbose = false */ ) {
        this.uri = uri;
        this.MongoClient = require('mongodb').MongoClient;
        this.__objectid = require('mongodb').ObjectId;
        this.time_tools   = require('./time_tools.js');
        this.time_t = new this.time_tools();
        this.__connector = null;
        this.__verbose = options.verbose;
        this.__database = database;
        this.client = new this.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    set_verbose(verbose) {
        this.__verbose = verbose;
    }
    // ok tested
    async drop_collection(__collection) {
        return new Promise((resolve, reject) => {
            this.__connector.collection(__collection).drop().then((result) => {
                if (this.__verbose) {
                    console.log('[' + this.time_t.date_time_epoch_ms() + '] drop collection ' + __collection + '.');
                }
                resolve(result);
            }).catch((err) => {
                if (this.__verbose) {
                    console.error('[' + this.time_t.date_time_epoch_ms() + '] drop collection ' + __collection + ' fail.');
                    console.error(err);
                }
                reject(err);
            });
        });
    }
    // ok tested
    async create_collection(__collectionName) {
        return new Promise((resolve, reject) => {
            this.__connector.createCollection(__collectionName).then((result) => {
                if (this.__verbose) {
                    console.log('[' + this.time_t.date_time_epoch_ms() + '] create collection ' + __collectionName + ' ok.');
                }
                resolve(result);
            }).catch((err) => {
                if (this.__verbose) {
                    console.log('[' + this.time_t.date_time_epoch_ms() + '] create collection ' + __collectionName + ' fail.');
                }
                reject(err);
            });
        });
    }

    async connect() {
        return new Promise((resolve, reject) => {
            (async() => {
                try {
                    await this.client.connect();
                    this.__connector = this.client.db(this.__database);
                    if (this.__verbose) {
                        console.log('[' + this.time_t.date_time_epoch_ms() + '] database connection ok.');
                    }
                    resolve(true);
                } catch(err) {
                    if(this.__verbose) {
                        console.log('[' + this.time_t.date_time_epoch_ms() + '] Fail to connect into database !!!');
                        console.log(err.stack);
                    }
                    this.__connector = null;
                    reject(false);
                }
            })();
        });
    }
    // ok not tested
    async delete_doc(__collection, __doc_selector) {
        return new Promise((resolve, reject) => {
            if (this.__verbose) {
                console.log('[' + this.time_t.date_time_epoch_ms() + '] delete document.');
            }
            this.__connector.collection(__collection).deleteOne(__doc_selector, {}, (err, result) => {
                if (err) {
                    console.error('[' + this.time_t.date_time_epoch_ms() + '] Mongodb Driver insertOne() - error from : easy_mongo class method delete_doc()');
                    console.error(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    }
    // ok tested
    async insert_doc(__collection, __doc) {
        return new Promise((resolve, reject) => {
            var doc = __doc;
            var doc_id = new this.__objectid();
            if (!doc._id) {
                doc._id = doc_id.toHexString();
            }
            if (this.__verbose) {
                console.log('[' + this.time_t.date_time_epoch_ms() + '] insert document : ' + doc._id);
            }
            this.__connector.collection(__collection).insertOne(doc, {
                forceServerObjectId: false,
                bypassDocumentValidation: true
            }, (err, result) => {
                if (err) {
                    console.error('[' + this.time_t.date_time_epoch_ms() + '] Mongodb Driver insertOne() - error from : easy_mongo class method insert_doc()');
                    console.error(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    }
    // ok not tested
    async insert_manydocs(__collection, __docs_array) {
        return new Promise((resolve, reject) => {
            if (this.__verbose) {
                console.log('[' + this.time_t.date_time_epoch_ms() + '] inserting ' + __docs_array.length + ' documents.');
            }
            var docs = [];
            var doc = undefined;
            var counter = __docs_array.length;
            for (var i = 0; i < counter; i++) {
                doc = __docs_array[i];
                if (!doc._id) {
                    doc._id = this.__objectid().toHexString();
                }
                docs.push(__docs_array[i]);
            }
            try {
                this.__connector.collection(__collection).insertMany(docs);
                resolve(result);
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    }
    // ok not tested
    async updateOne(__collection, __filter, __update) {
        return new Promise((resolve, reject) => {
            this.__connector.collection(__collection).updateOne(__filter, { $set: __update }, { upsert: true, bypassDocumentValidation: true }).then((result) => {
                if (this.__verbose) {
                    console.log('[' + this.time_t.date_time_epoch_ms() + '] update/insert document ok ' + result);
                }
                resolve(result);
            }).catch((err) => {
                console.error('[' + this.time_t.date_time_epoch_ms() + '] !!! Err: update/insert document fail.');
                console.error(err);
                reject(err);
            });
        });
    }
    // ok not tested
    async findOne(__collection, __filter, __projection = {}) {
        return new Promise((resolve, reject) => {
            this.__connector.collection(__collection).findOne(__filter, __projection).then((result) => {
                if (this.__verbose) {
                    console.log('[' + this.time_t.date_time_epoch_ms() + '] find document ok ' + result);
                }
                resolve(result);
            }).catch((err) => {
                console.error('[' + this.time_t.date_time_epoch_ms() + '] !!! Err: find document fail.');
                console.error(err);
                reject(err);
            });

        });
    }
    // ok
    async disconnect() {
        return new Promise((resolve, reject) => {
            (async() => {
                try {
                    await this.client.close();
                    if (this.__verbose) {
                        console.log('[' + this.time_t.date_time_epoch_ms() + '] Connection to database closed.');
                    }
                    resolve(true);
                } catch(err) {
                    if(this.__verbose) {
                        console.error('[' + this.time_t.date_time_epoch_ms() + '] !!! Err: Closing connection to database.');
                        console.error(err);
                    }
                    reject(err);
                }
            })();
        });
    }

}


/* Quik example

(async() => {
    const e_mongo = new easy_mongo('mongodb://localhost:27017/cryptocurrency');
    let connecting = await e_mongo.connect().then((result) => {
        console.log(' YAHHH Connected.');
    }).catch((err) => {
        console.log('ERROR');
    });
    for (let i = 0; i < 10; i++) {
        e_mongo.insert_doc('timer', { name: 'ATam84+' + i });
    }
    //e_mongo.insert_doc('timer', { _id: 200, name: 'ATam84+' });
    //e_mongo.insert_manydocs('timer', [{ _id: 201, name: 'ATam84+' }, { _id: 202, name: 'ATam84+' }, { name: 'ATam84+' }]);
    //await e_mongo.drop_collection('timer');   ok
    //await e_mongo.delete_doc('timer', { _id: 200 });  ok
    await e_mongo.create_collection('totox');
    e_mongo.disconnect();
})();

*/
