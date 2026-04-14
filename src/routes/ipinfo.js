const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const { getGeo, getASN } = require('../lib/geodb');
const cache = require('../lib/cache');
const { logger } = require('../lib/logger');

// ✅ Fix #2: toma solo la primera IP del header x-forwarded-for
function normalizeIp(ip) {
  if (!ip) return ip;
  // x-forwarded-for puede ser "IP1, IP2, IP3"
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  // quita prefijo IPv6-mapped ::ffff:
  return ip.replace(/^::ffff:/, '');
}

function parseAcceptLanguage(header) {
  if (!header) return [];
  return header.split(',').map(s => s.split(';')[0].trim());
}

// ✅ Validación de IP (IPv4 e IPv6)
function isValidIp(ip) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[\da-fA-F:]+$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

// Lógica compartida extraída en función
async function resolveIpInfo(ip, req) {
  const cacheKey = `ipinfo:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return { source: 'cache', ...cached };

  const geo = getGeo(ip) || {};
  const asn = getASN(ip) || {};

  const ua = req.headers['user-agent'] || '';
  const uaRes = new UAParser(ua).getResult();
  const langs = parseAcceptLanguage(req.headers['accept-language']);

  // ✅ Fix #1: raw_geo separado, no entra al cache
  const result = {
    ip,
    continent:       geo.continent?.names?.en          || null,
    country:         geo.country?.names?.en             || null,
    country_iso:     geo.country?.iso_code              || null,
    region:          geo.subdivisions?.[0]?.names?.en  || null,
    region_iso:      geo.subdivisions?.[0]?.iso_code   || null,
    city:            geo.city?.names?.en                || null,
    latitude:        geo.location?.latitude             || null,
    longitude:       geo.location?.longitude            || null,
    timezone:        geo.location?.time_zone            || null,
    postal:          geo.postal?.code                   || null,
    accuracy_radius: geo.location?.accuracy_radius      || null,
    asn:             asn.autonomous_system_number       || null,
    isp:             asn.autonomous_system_organization || null,
    languages:       langs,
    device: {
      type:    uaRes.device.type   || 'desktop',
      vendor:  uaRes.device.vendor || null,
      model:   uaRes.device.model  || null,
      os:      uaRes.os?.name
                 ? `${uaRes.os.name}${uaRes.os.version ? ' ' + uaRes.os.version : ''}`
                 : null,
      browser: uaRes.browser?.name
                 ? `${uaRes.browser.name}${uaRes.browser.version ? ' ' + uaRes.browser.version : ''}`
                 : null,
    },
  };

  await cache.set(cacheKey, result);

  // raw_geo solo en respuesta, no en cache
  return { source: cache.type, ...result, raw_geo: geo };
}

// GET / — IP inferida del request
router.get('/', async (req, res, next) => {
  try {
    let ip = req.query.ip
      || req.headers['x-forwarded-for']
      || req.socket.remoteAddress;

    if (Array.isArray(ip)) ip = ip[0];
    ip = normalizeIp(ip);

    if (!ip || !isValidIp(ip)) {
      return res.status(400).json({ error: 'IP no proporcionada o inválida' });
    }

    const data = await resolveIpInfo(ip, req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ✅ GET /:ip — IP explícita en la URL
router.get('/:ip', async (req, res, next) => {
  try {
    const ip = normalizeIp(req.params.ip);

    if (!isValidIp(ip)) {
      return res.status(400).json({ error: `IP inválida: ${ip}` });
    }

    const data = await resolveIpInfo(ip, req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
