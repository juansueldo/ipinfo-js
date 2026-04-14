const maxmind = require('maxmind');
const fs = require('fs');
const { logger } = require('./logger');

let cityLookup = null;
let asnLookup = null;

async function initGeoDB(cityDbPath, asnDbPath) {
  if (!fs.existsSync(cityDbPath)) {
    throw new Error(`GeoDB City no encontrada en ${cityDbPath}.`);
  }
  if (!fs.existsSync(asnDbPath)) {
    throw new Error(`GeoDB ASN no encontrada en ${asnDbPath}.`);
  }

  cityLookup = await maxmind.open(cityDbPath);
  asnLookup  = await maxmind.open(asnDbPath);
  logger.info('GeoDB City y ASN cargadas correctamente');
}

function getGeo(ip) {
  if (!cityLookup) return null;
  try {
    return cityLookup.get(ip);
  } catch {
    return null;
  }
}

function getASN(ip) {
  if (!asnLookup) return null;
  try {
    return asnLookup.get(ip);
  } catch {
    return null;
  }
}

module.exports = { initGeoDB, getGeo, getASN };