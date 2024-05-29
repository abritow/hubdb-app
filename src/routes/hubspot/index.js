'use strict'

const Config = require('../../lib/config');
const Account = require('../../models/Account');

module.exports = async function (fastify, opts) {
	/**
	 * Register app installation
	 *
	 * Creates a contact & a timeline event in root portal
	 *
	 * @param {Object} event
	 * @returns
	 */
	async function registerInstallation(event) {
		let contact = null;
		let contactResponse;
		const { userEmail, accountId, disableDate } = event;

		if (!Config.read('HUBSPOT_ROOT_ACCESS_TOKEN')) {
			return false;
		}

		const appName = Config.read('APP_NAME');

		const rootHubspotClient = fastify.hubspot.getRootClient();

		// Check if the contact exists
		try {
			const PublicObjectSearchRequest = { filterGroups: [{"filters":[{"value":userEmail,"propertyName":"email","operator":"EQ"}]}], sorts: ["email"], properties: ["email","id","product"], limit: 1, after: 0 };
			contactResponse = await rootHubspotClient.crm.contacts.searchApi.doSearch(PublicObjectSearchRequest);
			if (contactResponse.total < 1) {
				throw new Error('No contact was found.');
			}
			contact = contactResponse.results[0];
			if (!contact.properties.product?.includes(appName)) {
				let contactUpdateResponse;
				let products = contact.properties.product?.split(';') ?? [];
				products.push(appName);
				contactUpdateResponse = await rootHubspotClient.crm.contacts.basicApi.update(contact.id, {properties: {product: products.join(';')}});
				contact = contactUpdateResponse;
			}
		} catch (error) {
			// No contact was found, create a new contact
			try {
				contactResponse = await rootHubspotClient.crm.contacts.basicApi.create({
					properties: {
						email: userEmail,
						product: appName
					}
				});
				contact = contactResponse;
			} catch (err) {
				fastify.log.error(err?.response?.body);
			}
		}

		// Find root account
		const rootAccount = await Account.findOne({ isRoot: true }).exec();

		if (rootAccount && contact) {
			// Set up root's account HubSpot connection
			// You can't use an API key to create events
			const hubspotClient = await fastify.hubspot.setAccount(rootAccount.accountId);

			// Create app installation timeline event
			const eventObj = {
				eventTemplateId: Config.read('HUBSPOT_INSTALLATION_EVENT_ID'),
				objectId: contact.id,
				email: userEmail,
				tokens: {
					name: Config.read('APP_NAME'),
					portal: accountId,
					disableAt: disableDate.getTime(),
					status: 'trial'
				}
			};
			const eventResponse = await hubspotClient.crm.timeline.eventsApi.create(eventObj);
		}

		return true;
	}

	/**
	 * Build a HubSpot authorization URL and redirect the user to that location
	 */
	fastify.get('/oauth/connect', async (request, reply) => {
		const hubspotClient = fastify.hubspot.getClient();
		const hubspotRedirectURL = `${Config.read('BASE_URL')}/hubspot/oauth/callback`;
		const scope = Config.read('HUBSPOT_SCOPE').split(/ |, ?|%20/).join(' ');

		const authorizationUrl = hubspotClient.oauth.getAuthorizationUrl(
			Config.read('HUBSPOT_CLIENT_ID'),
			hubspotRedirectURL,
			scope
		);

		console.log(authorizationUrl, '<<< authorization url')

		reply.redirect(authorizationUrl);
	});

	/**
	 * Handle the OAuth 2.0 server response
	 */
	fastify.get('/oauth/callback', async (request, reply) => {
		const hubspotClient = fastify.hubspot.getClient();
		const hubspotRedirectURL = `${Config.read('BASE_URL')}/hubspot/oauth/callback`;
		const { code } = request.query;
		const redirectQuery = new URLSearchParams();

		try {
			// Exchange authorization code for tokens
			const tokenResponse = await hubspotClient.oauth.tokensApi.create(
				'authorization_code',
				code,
				hubspotRedirectURL,
				Config.read('HUBSPOT_CLIENT_ID'),
				Config.read('HUBSPOT_CLIENT_SECRET')
			);
			const { accessToken, refreshToken, expiresIn } = tokenResponse;
			const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

			// Get refresh token info
			const refreshTokenResponse = await hubspotClient.oauth.refreshTokensApi.get(refreshToken);
			const { hubId: accountId, user: userEmail, userId } = refreshTokenResponse;

			// Check if the app has been previously installed in the account
			let account = await Account.findOne({ accountId }).exec();

			if (!account) {

				const disableDate = new Date();
				const disableDateDays = disableDate.getDate() + 7;
				disableDate.setDate(disableDateDays);

				// Create account
				account = new Account({
					accountId,
					refreshToken,
					accessToken,
					tokenExpiresAt,
					userEmail,
					userId,
					appStatus: 'trial',
					plan: 'free',
					disableAt: disableDate
				});

				// Register installation
				try {
					await registerInstallation({
						userEmail,
						accountId,
						disableDate
					});
				} catch (error) {
					fastify.log.error(error?.response?.body);
				}
			} else {
				// Update account data
				// Don't update original userEmail & userId
				account.refreshToken = refreshToken;
				account.accessToken = accessToken;
				account.tokenExpiresAt = tokenExpiresAt;
			}

			await account.save();

			// Generate JWT token
			const jwtToken = fastify.jwt.sign({ accountId, userEmail, userId });

			redirectQuery.append('token', jwtToken);
		} catch (err) {
			fastify.log.error(err.response.body);

			redirectQuery.append('error', err.response.body.message);
		}

		reply.redirect(`/hubspot/installation?${redirectQuery.toString()}`);
	});

	/**
	 * Installation page
	 */
	fastify.get('/installation', {
		onRequest: fastify.authentication.validateJWT,
		handler: onInstallationView
	});

	async function onInstallationView(request, reply) {
		const { accountId } = request.user;

		const viewVars = {
			title: 'Well done!',
			text: 'Your HubSpot portal was successfully connected to Boilerplate for HubSpot.',
			URI: Config.read('BASE_URL'),
			links: {
				backToHubspot: `https://app.hubspot.com/discover/${accountId}/library/dashboards`,
				text: 'Back to HubSpot'
			}
		};

		return reply.view('/hubspot/installation.ejs', viewVars);
	}

	/**
	 * Webhook to handle subscriptions from HubSpot
	 */
	fastify.post('/subscriptions', {
		handler: onSubscriptionsPost
	});

	async function onSubscriptionsPost(request, reply) {

		// Wait some time
		await setTimeout(5000);

		const hubspotClient = fastify.hubspot.getRootClient();
		const data  = request.body;
		let contact;

		fastify.log.info(`Subscription: Starting activation of subscription ${data.objectId}`);

		try {
			const response = await hubspotClient.crm.contacts.searchApi.doSearch({
				filterGroups: [
					{
						filters: [
							{
								value: data.objectId,
								propertyName: 'objectarchivr_subscription_id',
								operator: 'EQ'
							}
						]
					}
				],
				properties: ['email', 'hubid'],
				limit: 1,
				after: 0
			});

			if (response.results.length) {
				contact = response.results[0];
			}
		} catch (error) {
			fastify.log.error({type: 'onSubscriptions', error, message: 'Unable to get contact'});

			return { error: error.message };
		}

		if (!contact) {
			let message = `We couldn't find any contact associated to this subscription.`;

			fastify.log.error({ type: 'onSubscriptions', message });

			return { error: message };
		}

		fastify.log.info(`Subscription: The contact associated to the subscription is ${contact.properties.email}`);

		let order;
		let account;

		// Save order

		if (data.properties.hs_next_payment_due_date) {
			try {
				order = await Order.create({
					subscriptionId: data.objectId,
					name: data.properties.hs_name.value,
					email: contact.properties.email,
					status: data.properties.hs_status.value,
					payload: JSON.stringify(data),
					used: false,
					paymentId: data.properties.hs_payments_source_id.value
				});

				fastify.log.info(`Subscription: Order ${order.name} (${order.status}) was saved!`);
			} catch (error) {
				fastify.log.error({type: 'onSubscriptions', error, message: 'Unable to save order'});
				return { error: error.message };
			}
		}

		// Find account

		let matchField = '';
		let matchValue = null;
		let matchFields = {
			'accountId': 'hubid',
			'userEmail': 'email'
		};

		try {
			// Fetch all accounts that either match the contact Hub Id, or the contact email
			let accounts = await Account
				.find({ $or: [{ accountId: contact.properties.hubid }, { userEmail: contact.properties.email }] })
				.sort({ createdAt: -1 })
				.exec();

			// Pick the first match, prioritize in the order specified by matchFields
			if (accounts.length) {
				top:
				for (const [ dbField, hsField ] of Object.entries(matchFields)) {
					for (const _account of accounts) {
						if (_account[dbField] == contact.properties[hsField]) {
							account = _account;
							matchField = dbField;
							matchValue = _account[dbField];

							break top;
						}
					}
				}
			}

			if (!account) {
				throw new Error(`No account found with the email ${contact.properties.email}, nor HubId ${contact.properties.hubid}`);
			}
		} catch (error) {
			fastify.log.error({
				type: 'onSubscriptions',
				message: error.message,
				error
			});

			return { error: error.message };
		}

		fastify.log.info(`Subscription: Account ${account.accountId} found by matching ${matchField} ${matchValue}`);

		// Activate account

		try {
			account.appStatus = 'active';
			account.activatedAt = new Date()
			account.plan = (data.properties.hs_recurring_billing_frequency.value == 'monthly') ? 'monthly' : (data.properties.hs_recurring_billing_frequency.value == 'annually') ? 'annually' : undefined;
			account.allowedUsers = 'any';

			if (data.properties.hs_next_payment_due_date) {
				const nextPaymentDueDate = new Date(Number(data.properties.hs_next_payment_due_date.value));
				account.disableAt = new Date(nextPaymentDueDate.setDate(nextPaymentDueDate.getDate() + 1));

				// Update order's account id
				order.accountId = account.accountId;

				await order.save();

				fastify.log.info(`Subscription: Account ${account.accountId} will be active until ${account.disableAt}!, calculated from hs_next_payment_date`);
			} else {
				const subscriptionCreationDate = new Date(Number(data.properties.hs_createdate.value));
				if (account.plan == 'monthly') {
					account.disableAt = new Date(subscriptionCreationDate.setMonth(subscriptionCreationDate.getMonth() + 1));
				} else {
					account.disableAt = new Date(subscriptionCreationDate.setFullYear(subscriptionCreationDate.getFullYear() + 1));
				}

				fastify.log.info(`Subscription: Account ${account.accountId} will be active until ${account.disableAt}!, calculated from code`);
			}

			await account.save();

			return { message: `Portal ${account.accountId} was activated.` };
		} catch (error) {
			fastify.log.error({type: 'onSubscriptions', error, message: 'Unable to activate account'});
			return { error: error.message };
		}
	}
}
