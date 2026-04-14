const NodeCache = require('node-cache');
const Redis = require('ioredis');
const { logger } = require('./logger');

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600'); // default 1h

let client = null;
let type = 'memory';

if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL);
  type = 'redis';
  client.on('error', (err) => logger.error('Redis error', err));
  logger.info('Cache: Redis habilitado');
} else {
  client = new NodeCache({ stdTTL: TTL });
  logger.info('Cache: node-cache (memoria) habilitado');
}

async function get(key) {
  if (type === 'redis') {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  }
  return client.get(key);
}

async function set(key, value, ttl = TTL) {
  if (type === 'redis') {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  }
  return client.set(key, value, ttl);
}

module.exports = { get, set, TTL, type };
