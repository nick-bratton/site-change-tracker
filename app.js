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
	let filter = await mongo.checkEtag(res);
	switch (filter.type){
		case 'init':
			gapi.insertDocumentToSheets([res.headers.date, res.statusCode.toString(), res.headers.etag]);
			email.sendEmail('init', reqOptions.uri)
			break;
		case 'update':
			gapi.insertDocumentToSheets([res.headers.date, res.statusCode.toString(), res.headers.etag]);
			email.sendEmail('update', reqOptions.uri)
			break;
		case 'ignore':
			break;
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