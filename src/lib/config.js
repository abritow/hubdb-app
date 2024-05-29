const envSchema = require('env-schema');

const Config = {
	store: {},

	load: function() {
		this.store = envSchema({
			schema: require('../schemas/env'),
			dotenv: true
		});
	},

	read: function(key) {
		return this.store[key];
	}
}

Config.load();

module.exports = Config;
