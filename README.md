# IP Info API

API REST para obtener información geográfica, ASN y datos básicos del dispositivo a partir de una dirección IPv4 o IPv6.

La API utiliza las bases locales GeoLite2 City y GeoLite2 ASN de MaxMind. Las respuestas pueden almacenarse temporalmente en memoria o Redis, pero el mecanismo de caché es interno y no modifica el formato de la respuesta.

## Requisitos

- Node.js 16 o superior.
- npm.
- Bases `GeoLite2-City.mmdb` y `GeoLite2-ASN.mmdb`.
- Redis opcional.

## Instalación

```bash
npm install
```

Las bases GeoLite2 incluidas deben estar ubicadas por defecto en:

```txt
src/db/GeoLite2-City.mmdb
src/db/GeoLite2-ASN.mmdb
```

También se pueden indicar otras ubicaciones mediante `GEODB_CITY_PATH` y `GEODB_ASN_PATH`.

Para descargar nuevas bases con una licencia de MaxMind:

```bash
chmod +x scripts/download-geolite.sh
./scripts/download-geolite.sh TU_MAXMIND_LICENSE_KEY ./src/db
```

## Variables de entorno

Crear un archivo `.env` en la raíz si se necesita personalizar la configuración:

```env
PORT=3000
CACHE_TTL_SECONDS=3600
REDIS_URL=redis://localhost:6379
GEODB_CITY_PATH=/ruta/GeoLite2-City.mmdb
GEODB_ASN_PATH=/ruta/GeoLite2-ASN.mmdb
LOG_LEVEL=info
```

`REDIS_URL` es opcional. Si no se configura, la API utiliza caché en memoria.

## Ejecución

En desarrollo:

```bash
npm run dev
```

En producción:

```bash
npm start
```

La API queda disponible por defecto en `http://localhost:3000`.

## Uso de la API

### Consultar una IP explícita

```http
GET /8.8.8.8
```

Ejemplo con curl:

```bash
curl -H "Accept-Language: es-AR,es;q=0.9" \
  -H "User-Agent: Mozilla/5.0" \
  http://localhost:3000/8.8.8.8
```

### Consultar por query param

```http
GET /?ip=8.8.8.8
```

```bash
curl "http://localhost:3000/?ip=8.8.8.8"
```

### Inferir la IP del request

```http
GET /
```

Si no se envía `ip`, la API toma la primera dirección de `X-Forwarded-For` o la dirección remota de la conexión.

## Respuesta exitosa

Los dos endpoints devuelven el mismo formato, independientemente de que la información se obtenga por primera vez o desde caché:

```json
{
  "ip": "8.8.8.8",
  "continent": "North America",
  "country": "United States",
  "country_iso": "US",
  "region": null,
  "region_iso": null,
  "city": null,
  "latitude": 37.751,
  "longitude": -97.822,
  "timezone": "America/Chicago",
  "postal": null,
  "accuracy_radius": 1000,
  "asn": 15169,
  "isp": "GOOGLE",
  "languages": [
    "es-AR",
    "es"
  ],
  "device": {
    "type": "desktop",
    "vendor": null,
    "model": null,
    "os": null,
    "browser": null
  }
}
```

Los datos que MaxMind no pueda determinar se devuelven como `null`. La respuesta no incluye información sobre si se utilizó memoria, Redis o caché.

## Errores

IP ausente o inválida:

```json
{
  "error": "IP no proporcionada o inválida"
}
```

IP inválida en la ruta:

```json
{
  "error": "IP inválida: valor-recibido"
}
```

Ambos casos responden con HTTP `400`.

Un error inesperado responde con HTTP `500`:

```json
{
  "error": "Internal Server Error",
  "message": "Descripción del error"
}
```

## Límites y headers

- Límite predeterminado: 100 solicitudes cada 15 minutos por IP.
- `Accept-Language`: se transforma en el array `languages`.
- `User-Agent`: se utiliza para completar `device`.
- `X-Forwarded-For`: se utiliza para inferir la IP cuando no se envía explícitamente.

## Docker

Para iniciar la API junto con Redis:

```bash
docker compose up --build
```

La API estará disponible en `http://localhost:3000`.

## OpenAPI

El contrato OpenAPI se encuentra en [`docs/openapi.yaml`](docs/openapi.yaml).
