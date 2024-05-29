'use strict'

require('dotenv').config();
const Config = require('../../lib/config');

const fp = require('fastify-plugin');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const hubspot = require('@hubspot/api-client');
const Contacts = require('./contacts');

// Models
const Account = require('../../models/Account');

function fastifyHubspot (fastify, options, done) {
	const uri = 'https://api.hubapi.com';
	let client;
	let rootClient;
	let clientOpts = {};
	let rootClientOpts = {};
	let account;

	if (Config.read('HUBSPOT_API_KEY')) {
		clientOpts.apiKey = Config.read('HUBSPOT_API_KEY');
	}

	if (Config.read('HUBSPOT_ROOT_ACCESS_TOKEN')) {
		rootClientOpts.accessToken = Config.read('HUBSPOT_ROOT_ACCESS_TOKEN');
	}

	client = new hubspot.Client(clientOpts);

	rootClient = new hubspot.Client(rootClientOpts);

	/**
	 *
	 * @param {object} clientData
	 */
	const setClient = clientData => {
		client = new hubspot.Client({ clientData });
	};

	/**
	 *
	 * @returns {hubspot.Client} Client
	 */
	const getClient = () => {
		return client;
	};

	/**
	 *
	 * @returns {hubspot.Client} Root Client
	 */
	const getRootClient = () => {
		return rootClient;
	};

	/**
	 *
	 * @param {string} method
	 * @param {string} path
	 * @param {object} body
	 * @returns {response.json} Fetched Data
	 */
	const customCall = async (method, path, body) => {
		var url = new URL(uri + path);
		url.searchParams.append('hapikey', Config.read('HUBSPOT_API_KEY'));
		const response = await fetch(url, {method, body});
		const data = await response.json();

		return data;
	};

	/**
	 * Token expires in 30 minutes (1800s)
	 *
	 * @param {string} refreshToken
	 * @returns {Object} Access token
	 */
	async function createAccessToken(refreshToken) {
		const tokenResponse = await client.oauth.tokensApi.create(
			'refresh_token',
			undefined,
			undefined,
			Config.read('HUBSPOT_CLIENT_ID'),
			Config.read('HUBSPOT_CLIENT_SECRET'),
			refreshToken
		);

		return tokenResponse;
	}

	/**
	 * Get Account
	 *
	 * @returns {Account} Account object
	 */
	function getAccount() {
		return account;
	}

	/**
	 * Set up the account the HubSpot client is going to use
	 *
	 * Fetch an access token from the database or create a new one from the account's refresh token
	 *
	 * @param {number} accountId - HubSpot id of the account
	 */
	async function setAccount(accountId) {
		let accessToken = null;

		const currentAccount = await Account.findOne({ accountId });

		if (!currentAccount) {
			throw new Error('Invalid account');
		}

		// Renew the token timeFrame minutes before expiration date
		let timeFrame = 2 * (60 * 1000);
		let renewAtTime = currentAccount.tokenExpiresAt.getTime() - timeFrame;

		if (Date.now() < renewAtTime) {
			// Token is valid
			accessToken = currentAccount.accessToken;
		} else {
			// The token has expired, renew it
			const accessTokenData = await createAccessToken(currentAccount.refreshToken);
			const tokenExpiresAt = new Date(Date.now() + accessTokenData.expiresIn * 1000);

			// Update the account in db
			currentAccount.accessToken = accessTokenData.accessToken;
			currentAccount.tokenExpiresAt = tokenExpiresAt;

			await currentAccount.save();

			accessToken = accessTokenData.accessToken;
		}

		// Create client from access token
		const hubspotClient = new hubspot.Client({});
		hubspotClient.setAccessToken(accessToken);

		return hubspotClient;
	}

	const contacts = Contacts(client);
	const hubspotDecorator = {
		setClient,
		getClient,
		getRootClient,
		customCall,
		getContacts: contacts.getContacts,
		createAccessToken,
		getAccount,
		setAccount
	};

	fastify.decorate('hubspot', hubspotDecorator);

	done();
}

module.exports = fp(fastifyHubspot, {
	fastify: '>=3.27.0',
	name: 'fastify-hubspot'
});
