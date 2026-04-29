# APIs faltantes para frontend SIEM

Este frontend ya consume:

- `GET /logs`
- `GET /sources/`
- `POST /sources/`

Para soportar completamente la UI se necesitan estos endpoints adicionales:

## Logs (consulta avanzada)

### `POST /logs/search`

Permite resolver filtrado, columnas, ventana temporal y paginación del lado servidor.

Request:

```json
{
  "source_ids": ["web-syslog-1", "fw-udp-2"],
  "time_range": {
    "from": "2026-04-22T20:00:00Z",
    "to": "2026-04-22T23:00:00Z"
  },
  "filters": [
    { "field": "severity", "operator": "eq", "value": "error" },
    { "field": "host", "operator": "contains", "value": "db01" }
  ],
  "query": "authentication failed",
  "columns": ["timestamp", "source_id", "host", "severity", "message"],
  "pagination": { "page": 1, "page_size": 25 },
  "sort": [{ "field": "timestamp", "direction": "desc" }]
}
```

Response:

```json
{
  "items": [
    {
      "timestamp": 1713816000,
      "source_id": "web-syslog-1",
      "data": {
        "host": "web01",
        "severity": "error",
        "message": "authentication failed"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total_items": 312,
    "total_pages": 13
  }
}
```

## Mappings

### `GET /mappings`

Lista todos los mappings existentes.

Response:

```json
[
  {
    "id": 1,
    "name": "syslog-default",
    "fields": [
      { "name": "host", "type": "string" },
      { "name": "severity", "type": "string" },
      { "name": "message", "type": "string" },
      { "name": "timestamp", "type": "date" }
    ]
  }
]
```

### `POST /mappings`

Crea un nuevo mapping.

Request:

```json
{
  "name": "syslog-default",
  "fields": [
    { "name": "host", "type": "string" },
    { "name": "severity", "type": "string" },
    { "name": "message", "type": "string" }
  ]
}
```

Response: `201 Created`

```json
{ "id": 1, "name": "syslog-default" }
```

### `DELETE /mappings/{id}`

Elimina un mapping por su ID numérico.

Response: `204 No Content`

### `POST /mappings/{id}/duplicate`

Duplica un mapping existente creando una copia con nombre sufijado.

Response: `201 Created`

```json
{ "id": 2, "name": "syslog-default (copy)" }
```

## Pipelines

### `GET /pipelines`

Lista todos los pipelines existentes.

Response:

```json
[
  {
    "id": 1,
    "name": "syslog-normalize",
    "processors": [
      { "type": "set", "config": { "field": "host", "value": "unknown" } },
      { "type": "lowercase", "config": { "field": "severity" } }
    ]
  }
]
```

### `POST /pipelines`

Crea un nuevo pipeline.

Request:

```json
{
  "name": "syslog-normalize",
  "processors": [
    { "type": "set", "config": { "field": "host", "value": "unknown" } },
    { "type": "lowercase", "config": { "field": "severity" } }
  ]
}
```

Response: `201 Created`

```json
{ "id": 1, "name": "syslog-normalize" }
```

### `DELETE /pipelines/{id}`

Elimina un pipeline por su ID numérico.

Response: `204 No Content`

### `POST /pipelines/{id}/duplicate`

Duplica un pipeline existente creando una copia con nombre sufijado.

Response: `201 Created`

```json
{ "id": 2, "name": "syslog-normalize (copy)" }
```

## Reglas

### `POST /rules`

Request:

```json
{
  "id": "auth-fail-burst",
  "query": "severity:error AND message:\"authentication failed\"",
  "interval_seconds": 60,
  "action": "webhook:https://alerts.example.com/siem"
}
```

Response: `201 Created`

```json
{ "id": "auth-fail-burst" }
```

### `GET /rules`

Response:

```json
[
  {
    "id": "auth-fail-burst",
    "query": "severity:error AND message:\"authentication failed\"",
    "interval_seconds": 60,
    "action": "webhook:https://alerts.example.com/siem",
    "enabled": true,
    "last_run_at": "2026-04-22T22:59:10Z",
    "last_match_count": 3
  }
]
```

### `PATCH /rules/{id}`

Se usa para habilitar/deshabilitar o modificar una regla.

Request ejemplo:

```json
{
  "enabled": false
}
```

Response:

```json
{
  "id": "auth-fail-burst",
  "enabled": false
}
```
