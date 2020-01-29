const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

(async function() {
  // Connection URL
  const url = 'mongodb://localhost:27017/myproject';
  // Database Name
  const dbName = 'myproject';
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Use connect method to connect to the Server
    await client.connect();

    const db = client.db(dbName);
    let insert = await db.collection('test_001').insertOne({ 'test_001': '001', 'test_002': 'test_002'});
    console.log(insert);
  } catch (err) {
    console.log(err.stack);
  }
  //let insert = await db.collection('test_001').insertOne({ 'test_001': '001', 'test_002': 'test_002'});
  //console.log(db.collection('test_001').find());

  client.close();
})();

