const mongoose = require('mongoose')

const ContactSchema = new mongoose.Schema({
	firstname: String,
	lastname: String,
	email: String,
	deletedAt: Date
}, {
	timestamps: {
		createdAt: 'createdAt'
	}
})

const Contact = mongoose.model('Contact', ContactSchema)

module.exports = Contact
