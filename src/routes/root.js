'use strict'

const Config = require('../lib/config');
const Account = require('../models/Account');

module.exports = async function (fastify, opts) {

	// Home
	fastify.get('/', async (request, reply) => {
		return reply.view('/pages/home.ejs', {
			species: 'human'
		});
	});

	/* Mongoose examples */

	// Mongoose Create Contacts
	fastify.get('/mongoose/contacts/create', async (request, reply) => {
		const contact = await fastify.mongoose.createContact({firstname: 'First', lastname: 'Last', email: 'firstlast@gmail.com'});

		reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ contact });
	});

	// Mongoose Get Contacts
	fastify.get('/mongoose/contacts', async (request, reply) => {
		const contacts = await fastify.mongoose.getContacts();

		reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ contacts });
	});

	/* HubSpot examples */

	// HubSpot Client
	fastify.get('/hubspot/client', async (request, reply) => {
		const hubspotClient = await fastify.hubspot.getClient();

		reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ hubspotClient });
	});

	// HubSpot Get Contacts
	fastify.get('/hubspot/contacts', async (request, reply) => {
		const contacts = await fastify.hubspot.getContacts();

		reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ contacts });
	});

	// HubSpot Custom Call
	fastify.get('/hubspot/custom', async (request, reply) => {
		const contacts = await fastify.hubspot.customCall('GET', '/crm/v3/objects/contacts');

		reply
			.code(200)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ contacts });
	});

	/**
	 * Clone view
	 */
	fastify.get('/active', {
		onRequest: fastify.authentication.validateJWT,
		handler: onActiveView
	});

	async function onActiveView(request, reply) {
		const { accountId, userEmail } = request.user;
        const { deal: dealId, token } = request.query;

		let account;

		try {
			account = await Account.findOne({ accountId });
		} catch (error) {
			fastify.log.error({type: 'onCloneView', error, message: 'Unable to fetch account'});
			throw fastify.httpErrors.serviceUnavailable('Unable to fetch account');
		}

		if (!account) {
			throw fastify.httpErrors.badRequest('Invalid account');
		}

		if (account.allowedUsers === 'owner' && userEmail !== account.userEmail) {
			const viewVars = {
				title: 'Oops!',
				URI: Config.read('BASE_URL'),
				text: `<p>Your team is currently on a <strong>free plan</strong>. With a free plan, the app is only available for the person who installed it from the App Marketplace.</p><p>Don't worry, though! It's simple to make it available to all users. Just ask <strong>${account.userEmail}</strong> to <strong>upgrade to the paid subscription</strong>. Not only will this unlock access for all users, but your team will also be able to set up automated duplication to save even more time!</p>`
			};

			return reply.view('/message.ejs', viewVars);
		}

		const viewVars = {
            title: request.t('duplicate.welcome.view-title'),
            URI: Config.read('BASE_URL'),
            appStatus: account.appStatus,
			plan: account.plan,
			links: {
				home: `https://app.hubspot.com/discover/${accountId}/library/dashboards`,
				text: 'Home'
			}
		};

		return reply.view('/active.ejs', viewVars);
	}
}
