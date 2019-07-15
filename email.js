const sg = require('@sendgrid/mail');
const sgCred = require('./private/sg.json');
const sgKey = sgCred.key;
const sgSender = sgCred.sender;
sg.setApiKey(sgKey);

const sgList = require('./private/addresses.json');
const addressList = sgList.addresses;
let addresses = [];

for (let key in addressList) {
	if (addressList.hasOwnProperty(key)) {
		let val = addressList[key];
		addresses.push(val.address);
	}
}

const msg = {
	to: addresses,
	from: sgSender,
	subject: '',
	text: '',
};

exports.sendEmail = (type, uri) => {
	switch (type){
		case 'init': 
			msg.subject = `Site tracking enabled for ${uri}`;
			msg.text = `You will receive email notifications when changes to the content at ${uri} are detected.`;
		case 'update':
			msg.subject = `Update Notification`;
			msg.text = `You requested to be notified when the content at ${uri} changed. The server replied with a new HTTP etag, highly suggesting that the HTML has been updated.`;
	}
	sg
		.sendMultiple(msg)
			.then(() => {
				console.log('email sent')
			})
			.catch(error => {
				console.error(error.toString());
			});
}