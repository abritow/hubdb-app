# Boilerplate

## Quick start

Setup your environment:

```bash
# Copy and edit env variables
cp .env.example .env
vim .env

# Install dependencies
npm install
```

To start the app in dev mode:

```bash
npm run dev
```

For production mode

```bash
npm run start
```

To watch & build your css assets run:

```bash
npm run build
```

## Scripts

### browser-sync

Launches a [browser-sync](https://browsersync.io/) instance. Browser sync creates a proxy and live reloads URLs whenever you make a change to any watched file (defined in `bs-config.js` `files` config).

To enable SSL for local development: `npm run browser-sync -- --https`.

## How-tos

### Adding a new config/env variable

Perform the following steps:

1. Define the property in `src/schemas/env.js`
2. Add an example of the config to `.env.example`. In a future release we will add a script to autogenerate this file from the schema
