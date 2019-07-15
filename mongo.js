const Mongo = require('mongodb').MongoClient;
const assert = require('assert');
const mongoConfig = require('./private/mongo')
const mongoUrl = mongoConfig.url;

async function detectChange(incomingEtag){
	let lastEtag, changed;
	await getPreviousDocumentFromMongo('events')
	.then(doc => {
		lastEtag = doc.etag;
		if (doc.etag == undefined){	// should be removed...
			lastEtag = 'dummy';				// this was a dev hack to get around
			console.log();						// changing my schema midway
			console.log('just set dummy')
		}
		changed = (lastEtag !== incomingEtag) && (lastEtag != undefined) && (incomingEtag != undefined);
		if (changed){
			directChangesToSheets(incomingEtag);
		}
	})
}

function directChangesToSheets(go){
	console.log('go??', go);
	gapi.insertDocumentToSheets(dataSheets);
	insertDocumentToMongo(dataMongo);
}

const insert = function(db, data, callback){
	// create an 'events' collection if one doesn't exist yet
	if (db.collection('events') === null || db.collection('events') === undefined){
		db.createCollection('events', function(err, res) {
			assert.equal(null,err);
			console.log('Collection created!');
		});
	}
	// insert
	db.collection('events').insertOne(
		{
			date: data.date,
			statusCode: data.statusCode,
			etag: data.etag
		}, 
		function(err, result){
			assert.equal(err, null);
			console.log('Successfully inserted document.');
			callback(result);
		}
	)
}

function insertDocumentToMongo(data){
	Mongo.connect(mongoUrl, function(err,client){
		assert.equal(null,err);
		insert(client.db(), data, function(result){
			// console.log(result);
			// client.close();
			// console.log("Closed connection to the MongoDB server.");
		});
	});
}

async function getPreviousDocumentFromMongo(coll){
	return Mongo.connect(mongoUrl)
		.then(client => client.db()
			.collection('events')
			.find()
			.sort(['_id', -1])
			.limit(1)
			.toArray()
			.then(data => (client.close(), data)))
		.catch(err => console.log('GOT ERROR' + err));
}