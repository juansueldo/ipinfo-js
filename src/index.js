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

const PORT = process.env.PORT || 3000;
const app = express();

// seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// logger HTTP con morgan -> winston
app.use(morgan('combined', { stream }));

// Rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_WINDOW_MS || '60000'), // 1 min default
  max: parseInt(process.env.RATE_MAX || '60'), // 60 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// trust proxy para obtener IP real si esta detrás de proxy/load balancer
app.set('trust proxy', true);

// Rutas
app.use('/', ipinfoRoute);

// Error handler
app.use(errorHandler);

// Inicializar GeoDB y luego levantar server
(async () => {
  try {
   await initGeoDB(
      process.env.GEODB_CITY_PATH || path.join(__dirname, '..', 'GeoLite2-City.mmdb'),
      process.env.GEODB_ASN_PATH  || path.join(__dirname, '..', 'GeoLite2-ASN.mmdb')
    );
    app.listen(PORT, () => {
      logger.info(`🌎 ipinfo-api escuchando en puerto ${PORT}`);
      logger.info(`Mode: ${process.env.NODE_ENV || 'production'}`);
    });
  } catch (err) {
    logger.error('Error inicializando GeoDB', err);
    process.exit(1);
  }
})();
