const Config = require('./src/lib/config');

// Run the server!
const server = require('./app')({ logger: true });

server.listen({host: Config.read('ADDRESS'), port: Config.read('PORT')}, (err, address) => {
	if (err) {
	  server.log.error(err);
	  process.exit(1);
	}
  });
