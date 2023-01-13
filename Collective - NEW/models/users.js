const mongoose = require('mongoose');

const User = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}	
}, { collection: 'users'}

);

//const User = mongoose.model('User', UserSchema);

module.exports = mongoose.model('User', User);

