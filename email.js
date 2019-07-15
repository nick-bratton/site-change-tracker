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

exports.sendEmail = () => {
	const msg = {
		to: addresses,
		from: sgSender,
		subject: 'Sending with Twilio SendGrid is Fun',
		text: "This was sent to multiple recipients"
		// html: '',
	};
	sg
		.sendMultiple(msg)
			.then(() => {
				console.log('email sent')
			})
			.catch(error => {

				//Log friendly error
				console.error(error.toString());

				//Extract error msg
				const {message, code, response} = error;

				//Extract response msg
				const {headers, body} = response;
			});
}