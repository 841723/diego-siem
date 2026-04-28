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

### `POST /mappings`

Request:

```json
{
  "id": "syslog-default",
  "fields": ["timestamp", "host", "program", "severity", "message"]
}
```

Response: `201 Created`

```json
{ "id": "syslog-default" }
```

### `GET /mappings`

Response:

```json
[
  {
    "id": "syslog-default",
    "fields": ["timestamp", "host", "program", "severity", "message"]
  }
]
```

## Pipelines

### `POST /pipelines`

Request:

```json
{
  "id": "syslog-normalize",
  "processors": ["parse_syslog", "normalize_severity", "extract_ip"]
}
```

Response: `201 Created`

```json
{ "id": "syslog-normalize" }
```

### `GET /pipelines`

Response:

```json
[
  {
    "id": "syslog-normalize",
    "processors": ["parse_syslog", "normalize_severity", "extract_ip"]
  }
]
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
