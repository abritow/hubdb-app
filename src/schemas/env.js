// See https://json-schema.org/learn/getting-started-step-by-step
module.exports = {
	type: 'object',
	required: ['PORT'],
	properties: {
		PORT: {
			type: 'number',
			default: 3000
		},
		ADDRESS: {
			type: 'string',
			description: 'Address for the Docker instance'
		},
		BASE_URL: {
			type: 'string',
			description: 'Base URL for your app'
		},
		APP_ID: {
			type: 'number',
			description: 'The HubSpot app ID'
		},
		HUBSPOT_DEVELOPER_API_KEY: {
			type: 'string',
			description: 'API key for the developer of the app on the HubSpot ecosystem'
		},
		APP_NAME: {
			type: 'string',
			description: 'The Name that the app will show'
		},
		HUBSPOT_ROOT_ACCESS_TOKEN: {
			description: 'Root portal stores customers & subscriptions',
			type: 'string'
		},
		HUBSPOT_API_KEY: {
			description: 'Customer portal API key',
			type: 'string'
		},
		HUBSPOT_CLIENT_ID: {
			description: 'This ID is unique to your app and is used for initiating OAuth',
			type: 'string'
		},
		HUBSPOT_CLIENT_SECRET: {
			description: 'Used to establish and refresh OAuth authentication',
			type: 'string'
		},
		HUBSPOT_SCOPE: {
			description: 'A space or comma separated set of permissions that your HubSpot app needs access to',
			type: 'string',
			examples: [
				'crm.objects.contacts.write,crm.objects.contacts.read',
				'crm.objects.contacts.write crm.objects.contacts.read'
			]
		},
		HUBSPOT_INSTALLATION_EVENT_ID: {
			type: 'number',
			description: 'The timeline event template ID to use for the installation event'
		},
		MONGODB_URI: {
			description: 'MongoDb connection URI',
			type: 'string',
			examples: [
				'mongodb://localhost:27017/test'
			]
		},
		JWT_SECRET: {
			type: 'string',
			description: 'JWT secret'
		},
		JWT_EXPIRES_IN: {
			type: 'string',
			description: 'Time span after which the token expires, added as the exp claim in the payload.  It is expressed in seconds or a string describing a time span',
			examples: [
				'60s',
				'6h',
				'5d'
			]
		},
	}
}
