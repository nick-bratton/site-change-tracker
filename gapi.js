require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const scope = ['https://www.googleapis.com/auth/spreadsheets'];
const credentialsPath = 'private/credentials.json'
const tokenPath = 'private/token.json';
const spreadsheetId = process.env.SPREADSHEETID;
let token;

fs.readFileAsync = function(path){
	return new Promise(function(resolve,reject){
		fs.readFile(path, function(err,data){
			if (err){
				reject(err);
			}
			else{
				resolve(data);
			}
		})
	})
}

async function loadCredentials(path){
	let cred = await fs.readFileAsync(path);
	cred = JSON.parse(cred);
	return cred
}

async function createOAuth2ClientInstance(){
	let cred = await loadCredentials(credentialsPath);
	const client = await new google.auth.OAuth2(
		cred.installed.client_id,
		cred.installed.client_secret,
		cred.installed.redirect_uris[1]
	);
	return client;
}

async function setClientCredentials(client, callback){
	return new Promise((resolve, reject) => {
		token = fs.readFileSync(tokenPath);
		token = JSON.parse(token);
		if(!token.hasOwnProperty('refresh_token') && Object.entries(token).length === 0 && token.constructor === Object){
			console.log('No refresh token was found at private/token.json.');
			try {
				getToken(client, callback);
			}
			catch(err){
				console.error('Error getting new token..');
				reject(err);
			}
		}
		else if(token.hasOwnProperty('refresh_token')){
			try{ 
				client.credentials = token;
				resolve(client);
			}
			catch(err){
				reject(err)
			}
		}
	});
}

async function getToken(client, callback){
	return new Promise((resolve, reject) => {
		const authorizeURL = client.generateAuthUrl({
			access_type: 'offline',
			scope: scope
		});
		console.log('Authorize at: ' + authorizeURL);
		const rl = readline.createInterface({
			intput: process.stdin,
			output: process.stdout
		});
		rl.question('PASTE the authorization code here. Then press ENTER: ' , (code) => {
			rl.close();
			client.getToken(code, (err, token) => {
				if (err) return console.error('Error retrieving access token: ', err);
				client.setCredentials(token);
				fs.writeFileSync(tokenPath, JSON.stringify(token), (err) => {
					if (err) return console.log('Error writing token file..' + err);
					console.log('Authorized! Your token can be found at: ' + path);
				});
			});
			resolve(client);
			callback(client); // ...
		});
	});
}

async function getNextEmptyRow(client){
	return new Promise((resolve, reject) => {
		const sheets = google.sheets({version: 'v4', client});
		try {
			sheets.spreadsheets.values.get({
				auth: client,
				spreadsheetId: spreadsheetId,
				range: 'A:A'
			}, function (err, result) {
				if (err) {
					console.log('The API returned an error: ' + err);
				} else {
					const numRows = result.data.values ? result.data.values.length : 0;
					resolve(numRows + 1);
				}
			})
		}
		catch (err){
			reject(err);
		}
	});
}

async function writeToRow(client, row, data){
	return new Promise((resolve, reject) => {
		const sheets = google.sheets({version: 'v4', client});

		sheets.spreadsheets.values.update({
			auth: client,
			spreadsheetId: spreadsheetId,
			range: `A${row}:C${row}`,
			valueInputOption: 'RAW',
			resource:{
				values: [data]
			}
		}, (err, res) => {
			if (err){
				reject(err);
			}
			else{
				resolve(res);
			}
		});
	});
}	

exports.insertDocumentToSheets = async(data) => {
	let row;
	const client = await createOAuth2ClientInstance();
	setClientCredentials(client)
	.then(async client => {
		row = await getNextEmptyRow(client)
	})
	.then(async => {
		writeToRow(client, row, data)
	}, err => {
		console.log(err);
	});
}