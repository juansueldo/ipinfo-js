# Actualización OpenAPI - Unificar respuesta de IP Info

## Fecha

2026-06-19

## Resumen

Se unificó el formato público de la respuesta para que sea idéntico al calcular la información y al recuperarla desde caché. Se dejaron de exponer el origen interno de los datos y la respuesta cruda de MaxMind.

## Endpoints afectados

- GET /
- GET /{ip}

## Cambios realizados

- Se eliminó el campo dinámico `source`.
- Se eliminaron los posibles valores públicos `memory`, `redis` y `cache`.
- Se eliminó el campo interno `raw_geo` de la respuesta pública.
- Se definió un único schema reutilizable para ambos endpoints.
- Se agregó el contrato principal en `docs/openapi.yaml`.

## Request actualizado

No se modificaron los parámetros de entrada. Se admite una IP mediante el query param `ip`, el path param `ip` o la IP inferida del request.

Los headers opcionales `Accept-Language` y `User-Agent` continúan utilizándose para completar `languages` y `device`.

## Response actualizado

Las respuestas exitosas contienen únicamente los campos documentados en el schema `IpInfo`. El formato ya no depende del estado o del proveedor de caché.

## Códigos HTTP

- 200: información de la IP obtenida correctamente.
- 400: IP ausente o inválida.
- 429: límite de solicitudes excedido.
- 500: error interno del servidor.

Los códigos 201, 401, 403, 404, 409 y 422 no aplican a estos endpoints de consulta pública.

## Impacto en Swagger/OpenAPI

Se creó `docs/openapi.yaml` con la documentación de ambos endpoints, sus parámetros, respuestas, errores y schemas reutilizables.

## Impacto en frontend

El frontend debe dejar de depender de los campos `source` y `raw_geo`. El resto de los campos mantiene sus nombres y tipos.

## Observaciones

La API puede seguir utilizando caché en memoria o Redis internamente. Esa implementación ya no queda expuesta en el contrato público.
