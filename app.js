#!/usr/bin/env nodejs
'use strict';

const gapi = require('./gapi');
const mongo = require('./mongo')
const email = require('./email')
const assert = require('assert');
const rp = require('request-promise');
const Cron = require('cron').CronJob;
const Mongo = require('mongodb').MongoClient;
const mongoConfig = require('./private/mongo')
const mongoUrl = mongoConfig.url;

async function lastEtagMatchesIncomingEtag(res){

	let incomingEtag = res.headers.etag;
	let changed, lastEtag;

	await getPreviousDocumentFromMongo('events')
	.then(doc => {
		// move these checks up in the thread: (doc[0].etag != undefined) && (doc[0].hasOwnProperty('etag')
		if (doc[0].etag !== incomingEtag){
			console.log('Got new etag: ' + doc[0].etag);
			let dataMongoFormatted = {"date": res.headers.date, "statusCode": res.statusCode, "etag": res.headers.etag};
			let dataSheetsFormatted = [res.headers.date, res.statusCode.toString(), res.headers.etag];
			saveChangeAndNotify(dataMongoFormatted, dataSheetsFormatted);
		}
		else{
			console.log('No change to etag. Nothing to do.')
		}
	})
}

function saveChangeAndNotify(mongo, sheets){
	console.log('Server returned new etag. Something likely changed.');
	gapi.insertDocumentToSheets(sheets);
	insertDocumentToMongo(mongo);
	email.sendEmail()
}

const insert = function(db, data, callback){
	// create an 'events' collection if one doesn't exist yet
	//
	if (db.collection('events') === null || db.collection('events') === undefined){
		db.createCollection('events', function(err, res) {
			assert.equal(null,err);
			console.log('Collection created!');
		});
	}
	// insert
	//
	db.collection('events').insertOne(
		{
			date: data.date,
			statusCode: data.statusCode,
			etag: data.etag
		}, 
		function(err, result){
			assert.equal(err, null);
			console.log('Inserted document to Mongo.');
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

async function handleResponse(res){
	let filter = await lastEtagMatchesIncomingEtag(res);
}



let reqOptions = {
	resolveWithFullResponse: true,
	uri: 'http://localhost:3030',
	headers: {
		'Cache-Control': 'no-cache'
	}
};

function visitSite(options){
	rp(options)
		.then(function (response) {
			handleResponse(response)

		})
		.catch(function (err) {
			console.log(err);
		});
}



new Cron('*/3 * * * * *', function() {
	visitSite(reqOptions);
}, null, true, 'Europe/Berlin');