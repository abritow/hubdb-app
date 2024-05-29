// Config
const Config = require('../../../../lib/config');
// Models
const Account = require('../../../../models/Account');

const moment = require('moment');

module.exports = async function (fastify, opts) {
	/**
	 * Display Deals CRM Card with Payment Links list
	 */
	fastify.get('/deals', async (request, reply) => {
		const { associatedObjectId, associatedObjectType, portalId: accountId, userEmail, userId } = request.query;
		const token = fastify.jwt.sign({ accountId, userEmail, userId });

		let account;
        try{
			account = await Account.findOne({ accountId });
		} catch (error) {
			fastify.httpErrors.serviceUnavailable(request.t('errors.unable-fetch-account'));
		}

		// Validate if account exists
        if (!account) {
            throw fastify.httpErrors.badRequest(request.t('errors.invalid-account'));
        }

		const disableAt = account.disableAt ? moment(account.disableAt) : moment()

		// Deactivate account if already expired
		if (account.appStatus == 'active' && moment() > disableAt) {
			account.appStatus = 'inactive';
			try {
				await account.save();
			} catch (error) {
				fastify.httpErrors.serviceUnavailable(request.t('errors.unable-save-account'));
			}

			fastify.log.info(`Account disabled: ${account.accountId}`);
		}

		// Setup CRM Card main button and secondary dropdown
		const primaryUri = new URL(
			(account.appStatus == 'inactive') ? '/inactive': '/active',
			Config.read('BASE_URL')
		);

		primaryUri.search = new URLSearchParams({ deal: associatedObjectId, token, embedded: 1 });

		// Secondary actions
		const feedbackAction = {
			type: 'IFRAME',
			width: 890,
			height: 748,
			uri: primaryUri,
			label: request.t('crm.card.cta.give-feedback')
		};

		const secondaryActions = [
			feedbackAction
		];

		reply.code(200).send({
			primaryAction: {
			  type: 'IFRAME',
			  width: 890,
			  height: 748,
			  uri: primaryUri,
			  label: 'Boilerplate'
			},
			secondaryActions
		});
	});
}
