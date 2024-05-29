'use strict'

module.exports = async function (fastify, opts) {
	fastify.get('/', async (request, reply) => {
		return {hello: 'world'};
	});

	// HubSpot Get Contacts
	fastify.get('/hubspot/contacts', async (request, reply) => {
		const contacts = await fastify.hubspot.getContacts();

		reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ contacts });
	});
}
