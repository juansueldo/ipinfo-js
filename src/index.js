require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initGeoDB } = require('./lib/geodb');
const ipinfoRoute = require('./routes/ipinfo');
const { logger, stream } = require('./lib/logger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_MAX || '60'),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.set('trust proxy', true);
app.use('/', ipinfoRoute);
app.use(errorHandler);

// ✅ Inicialización lazy: se ejecuta una vez y se reutiliza entre invocaciones
let initialized = false;
async function ensureInit() {
  if (initialized) return;
  await initGeoDB(
    process.env.GEODB_CITY_PATH || path.join(__dirname, '..', 'GeoLite2-City.mmdb'),
    process.env.GEODB_ASN_PATH  || path.join(__dirname, '..', 'GeoLite2-ASN.mmdb')
  );
  initialized = true;
}

// ✅ Exportar como función serverless (Vercel lo necesita así)
module.exports = async (req, res) => {
  await ensureInit();
  app(req, res);
};

// ✅ Desarrollo local: solo escucha si se corre directamente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  ensureInit().then(() => {
    app.listen(PORT, () => {
      logger.info(`🌎 ipinfo-api escuchando en puerto ${PORT}`);
    });
  }).catch(err => {
    logger.error('Error inicializando GeoDB', err);
    process.exit(1);
  });
}
