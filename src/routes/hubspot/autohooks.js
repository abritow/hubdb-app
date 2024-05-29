const Config = require('../../lib/config');

module.exports = async function (fastify, opts) {
	/**
	 * Validate requests coming from HubSpot
	 *
	 * Supports signatures version 2 & 3.
	 * If your route should receive something in the body, make sure you enable rawBody parsing
	 * at the route level: {rawBody: true}
	 *
	 * See https://developers.hubspot.com/docs/api/webhooks/validating-requests
	 * @param {*} request
	 */
	function validateSignature(request) {
		if (!request.headers['x-hubspot-signature'] ||
			!request.headers['x-hubspot-signature-version']) {
			throw fastify.httpErrors.unauthorized('HubSpot signature required');
		}

		const crypto = require('crypto');
		const URL = Config.read('BASE_URL') + request.url;
		let token;
		let signature;
		let body = request.rawBody ?? '';
		let hubspotSignature = request.headers['x-hubspot-signature'];

		// Compute the request signature
		if (request.headers['x-hubspot-signature-version'] == 'v3' ||
			request.headers['x-hubspot-signature-v3']) {
			if (request.headers['x-hubspot-signature-v3']) {
				hubspotSignature = request.headers['x-hubspot-signature-v3'];
			}

			// Reject the request if the timestamp is older than 5 minutes
			let timeFrame = 5 * 60 * 1000;

			if ((Date.now() - timeFrame) > request.headers['x-hubspot-request-timestamp']) {
				throw fastify.httpErrors.unauthorized('Request timestamp is older than 5 minutes');
			}

			// Request method + request uri + request body + timestamp
			token = request.method + URL + body + request.headers['x-hubspot-request-timestamp'];
			signature = crypto
				.createHmac('sha256', Config.read('HUBSPOT_CLIENT_SECRET'))
				.update(token)
				.digest('base64');
		} else if (request.headers['x-hubspot-signature-version'] == 'v2') {
			// Client secret + request method + request uri + request body
			token = Config.read('HUBSPOT_CLIENT_SECRET') + request.method + URL + request.body;
			signature = crypto
				.createHash('sha256')
				.update(token)
				.digest('hex');
		} else {
			throw fastify.httpErrors.unauthorized('Unsupported signature version');
		}

		// Validate the request signature matches the computed hash
		if (hubspotSignature != signature) {
			throw fastify.httpErrors.unauthorized('Invalid signature');
		}
	}

	fastify.addHook('preValidation', async (request, reply) => {
		if (/^\/hubspot\/(crm-card|webhooks)\//.test(request.routerPath)) {
			validateSignature(request);
		}
	});
}
