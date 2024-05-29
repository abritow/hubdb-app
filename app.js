require('dotenv').config();
const Config = require('./src/lib/config');


function buildFastify(opts = { logger: true }) {
	// Require the framework and instantiate it
	const fastify = require('fastify')({logger: true});
	const path = require('path');
	const AutoLoad = require('@fastify/autoload');

	// i18n
	const i18next = require('i18next')
	const Backend = require('i18next-fs-backend')
	const i18nmiddleware = require('i18next-http-middleware')

	i18next.use(Backend).use(i18nmiddleware.LanguageDetector).init({
		preload: ['en', 'es'],
		fallbackLng: 'en',
		saveMissing: true,
		backend: {
			loadPath: __dirname + '/src/locales/{{lng}}/{{ns}}.json',
			addPath: __dirname + '/src/locales/{{lng}}/{{ns}}.missing.json'
		},
		detection: {
			cookieSameSite: 'lax'
		}
	})

	fastify.register(i18nmiddleware.plugin, { i18next })

	// Serve static files
	fastify.register(require('@fastify/static'), {
		root: path.join(__dirname, 'public')
	});

	// Templates rendering
	fastify.register(require('@fastify/view'), {
		engine: {
			ejs: require('ejs')
		},
		root: path.join(__dirname, '/src/views'),
		layout: 'layouts/main'
	});

	// Sensible adds some useful decorators such as HTTP errors and assertions
	fastify.register(require('@fastify/sensible'));

	// Adds the raw body to the Fastify request object
	fastify.register(require('fastify-raw-body'), {
		global: false
	});

	// JWT utils
	fastify.register(require('@fastify/jwt'), {
		secret: Config.read('JWT_SECRET'),
		sign: {
			expiresIn: Config.read('JWT_EXPIRES_IN')
		},
		verify: {
			extractToken: (request) => {
				let token = null;

				if (request.query?.token) {
					token = request.query.token;
				} else if (request.headers && request.headers.authorization) {
					const parts = request.headers.authorization.split(' ')

					if (parts.length === 2) {
						const scheme = parts[0];

						if (/^Bearer$/i.test(scheme)) {
							token = parts[1];
						}
					}
				}

				return token;
			}
		}
	});

	// Load plugins
	fastify.register(AutoLoad, {
		dir: path.join(__dirname, 'src/plugins')
	});

	// Load routes
	fastify.register(AutoLoad, {
		dir: path.join(__dirname, 'src/routes'),
		autoHooks: true,
		cascadeHooks: true
	});

	return fastify;
}

module.exports = buildFastify;
