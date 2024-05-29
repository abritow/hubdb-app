'use strict'

module.exports = async function (fastify, opts) {
	fastify.post('/deals', {
		config: {rawBody: true},
		handler: async (request, reply) => {
			fastify.log.info(request.body);

			return {success: true};
		}
	});
}
