require('dotenv').config();
const Mongo = require('mongodb').MongoClient;
const mongoUrl = process.env.MONGOURL;

async function getPreviousDocumentFromMongo(collName){
	return Mongo.connect(mongoUrl, { useNewUrlParser: true })
		.then(client => client.db()
			.collection(collName)
			.find()
			.sort(['_id', -1])
			.limit(1)
			.toArray()
			.then(doc => (client.close(), doc) ))
		.catch(err => console.log('Error getting previous document from database: ' + err));
}

async function isEtagUnique(incomingEtag, collName){
	return new Promise(async (resolve,reject) => {
		await getPreviousDocumentFromMongo(collName)
		.then(previousDoc => {
			if (previousDoc[0].etag !== incomingEtag){
				resolve(true);
			}
			else{
				resolve(false);
			}
		})
	})
}

async function doesCollectionExist(collName){
	return new Promise((resolve,reject) => {
		Mongo.connect(mongoUrl, { useNewUrlParser: true })
		.then(client => client.db()
			.listCollections()
			.toArray()
			.then(cols => {
				let exists = false;
				for (col of cols){
					if (col.name == collName){
						exists = true; 
						resolve(true);
					}
				}
				if (!exists){
					resolve(false);
				}
			})
		)
	})
}

async function initializeCollection(collName){
	return Mongo.connect(mongoUrl, { useNewUrlParser: true })
		.then(client => client.db()
			.createCollection(collName)
			.then(response => (client.close(), response) ))
		.catch(err => console.log(`Error initializing collection ' + "${collName}"`));
}

async function insertDocumentToMongo (res, collName){
	return Mongo.connect(mongoUrl, { useNewUrlParser: true })
	.then(client => client.db().collection(collName)
		.insertOne(
			{ 
				date: res.headers.date,
				statusCode: res.statusCode,
				etag: res.headers.etag
			})
		.then(data => client.close(), res))
		.catch(err => console.log('GOT ERROR' + err));
}

exports.checkEtag = async(res) => {
	const collName = 'foo10';
	return new Promise(async (resolve,reject) => {
		let collExists = await doesCollectionExist(collName);
		if (collExists){
			let etagIsUnique = await isEtagUnique(res.headers.etag, collName);
			if (etagIsUnique){
				insertDocumentToMongo(res, collName).then(async => {
					resolve({'res': res, 'type':'update'})
				})
			}
			else {
				resolve({'res': res, 'type':'ignore'});
			}
		}
		else{
			initializeCollection(collName)
			.then(async => {
				insertDocumentToMongo(res, collName).then(async => {
					resolve({'res': res, 'type':'init'})
				})
			})
		}	
	})
}