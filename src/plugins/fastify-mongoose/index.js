'use strict'

require('dotenv').config();
const Config = require('../../lib/config');

const fp = require('fastify-plugin');

const mongoose = require('mongoose');
const Contacts = require('./contacts');

function fastifyMongoose (fastify, options, done) {
	const contacts = Contacts();

	if (Config.read('MONGODB_URI')) {
		mongoose.connect(Config.read('MONGODB_URI'), { useUnifiedTopology: true });
	}

	/**
	 *
	 * @param {string} uri
	 * @param {object} options
	 */
	const connect = (uri, options) => {
		mongoose.connect(uri, options);
	}

	const mongooseDecorator = {
		connect,
		createContact: contacts.createContact,
		getContacts: contacts.getContacts
	}

	fastify.decorate('mongoose', mongooseDecorator);

	done();
}

module.exports = fp(fastifyMongoose, {
	fastify: '>=3.27.0',
	name: 'fastify-mongoose'
});
