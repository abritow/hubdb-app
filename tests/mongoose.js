'use strict'

require('dotenv').config();
const Config = require('../../lib/config');

const t = require('tap');
const test = t.test;
const fastify = require('fastify')({logger: true});

const fastifyMongoose = require('fastify-mongoose');

test('fastify.mongo should exist', t => {
  t.plan(4);

  fastify.register(fastifyMongoose, {
    uri: Config.read('MONGODB_URI')
  });

  fastify.ready(err => {
    t.error(err);
    t.ok(fastify.mongo);
    t.ok(fastify.mongo.db);
    t.ok(fastify.mongo.ObjectId);

    fastify.close();
  });
});
