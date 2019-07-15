#!/usr/bin/env nodejs
'use strict';

const gapi = require('./gapi');
const mongo = require('./mongo')
const email = require('./email')
const rp = require('request-promise');
const Cron = require('cron').CronJob;

let reqOptions = {
	resolveWithFullResponse: true,
	uri: 'http://localhost:3030',
	headers: {
		'Cache-Control': 'no-cache'
	}
};



async function handleResponse(res){
	let checkEtagAginstCollection = await mongo.checkEtag(res);
	console.log(checkEtagAginstCollection.type);

	// if (etagIsNewOrDbWasEmpty){
	// 	console.log('New etag + response: ' + etagIsNewOrDbWasEmpty);
	// 	saveChangeAndNotify(res)
	// }
	// else {

	// 	console.log('No changes at this time.');
	// }
}





function saveChangeAndNotify(res, justInitialized){
	// gapi.insertDocumentToSheets([res.headers.date, res.statusCode.toString(), res.headers.etag]);
	// mongo.insertDocumentToMongo({"date": res.headers.date, "statusCode": res.statusCode, "etag": res.headers.etag});
	
	// !!! DEFINE THIS !!!
	if (justInitialized === true){
		email.sendInitializationEmail()
	}
	else if (justInitialized === false){
		email.sendUpdateEmail()
	}
}

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