const fp = require('fastify-plugin');

async function plugin(fastify, opts) {
	async function validateHubSpotSignature(request, reply) {
		try {
			fastify.hubspot.validateSignature(request);
		} catch (error) {
			throw fastify.httpErrors.unauthorized(error.message);
		}
	}

	async function validateJWT(request, reply) {
		try {
			await request.jwtVerify()
		} catch (error) {
			reply.send(error);
		}
	}

	fastify.decorate('authentication', {
		validateHubSpotSignature,
		validateJWT
	});
}

module.exports = fp(plugin, {
	name: 'authentication',
	fastify: '^4.21.0',
	dependencies: [
		'fastify-hubspot',
		'@fastify/sensible',
		'@fastify/jwt'
	]
});
