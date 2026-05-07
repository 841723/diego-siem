# APIS_FALTANTES — frontend SIEM

Este documento lista **solo** APIs faltantes en backend necesarias para cubrir completamente el frontend actual (incluyendo Pipelines y Rules).

---

## 1) Rules (CRUD)

### 1.1 `GET /rules`

- **Descripción:** Lista reglas para la tabla principal de Rules.
- **Request body:** No aplica.
- **Response body (200):**

```json
[
  {
    "id": "uuid",
    "name": "Failed login burst",
    "description": "Detecta múltiples fallos de login",
    "type": "threshold",
    "enabled": true,
    "severity": "high",
    "config": {
      "field": "failed_logins",
      "operator": ">=",
      "value": 5,
      "window_minutes": 10
    },
    "last_execution_at": "2026-05-07T18:00:00Z",
    "created_at": "2026-05-07T17:00:00Z",
    "updated_at": "2026-05-07T17:30:00Z"
  }
]
```

- **Errores posibles:** `500` (error interno).

### 1.2 `GET /rules/:id`

- **Descripción:** Obtiene una regla para edición/detalle.
- **Request body:** No aplica.
- **Response body (200):** mismo contrato de una regla.
- **Errores posibles:** `400` (id inválido), `404` (no existe), `500`.

### 1.3 `POST /rules`

- **Descripción:** Crea una regla.
- **Request body:**

```json
{
  "id": "uuid",
  "name": "Suspicious process",
  "description": "Match por commandline",
  "type": "match",
  "enabled": true,
  "severity": "medium",
  "config": {
    "field": "process.command_line",
    "pattern": "powershell -enc",
    "case_sensitive": false
  }
}
```

- **Response body (201):** regla creada (incluyendo timestamps).
- **Errores posibles:** `400` (payload inválido), `409` (id/nombre duplicado), `500`.

### 1.4 `PUT /rules/:id`

- **Descripción:** Actualiza regla existente.
- **Request body:** mismo contrato que `POST /rules` (sin necesidad de `id` en body).
- **Response body (200):** regla actualizada.
- **Errores posibles:** `400`, `404`, `409`, `500`.

### 1.5 `DELETE /rules/:id`

- **Descripción:** Elimina una regla.
- **Request body:** No aplica.
- **Response body (200):**

```json
{ "message": "Rule deleted successfully" }
```

- **Errores posibles:** `400`, `404`, `500`.

---

## 2) Alerts de reglas

### 2.1 `GET /rules/alerts`

- **Descripción:** Lista alertas generadas por reglas.
- **Query params opcionales:** `rule_id=<uuid>`, `status=open|acknowledged|resolved`, `from=<RFC3339>`, `to=<RFC3339>`.
- **Request body:** No aplica.
- **Response body (200):**

```json
[
  {
    "id": "uuid",
    "rule_id": "uuid",
    "rule_name": "Failed login burst",
    "timestamp": "2026-05-07T18:02:10Z",
    "severity": "high",
    "message": "8 failed logins in 5 minutes",
    "status": "open",
    "details": {
      "source_ip": "10.0.0.12",
      "host": "srv-auth-01",
      "events": 8
    }
  }
]
```

- **Errores posibles:** `400` (filtros inválidos), `500`.

---

## 3) Pipelines — gap funcional pendiente recomendado

> El frontend ya usa `GET /processors`, `GET /pipelines/:id/full` y CRUD en `/pipelines/:id/processors`.
> Sin embargo, para garantizar **reordenamiento determinista** de processors falta un contrato explícito de orden.

### 3.1 `PUT /pipelines/:id/processors/reorder` (recomendado)

- **Descripción:** Reordena processors sin borrar/recrear registros.
- **Request body:**

```json
{
  "processor_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

- **Response body (200):**

```json
{
  "pipelineid": "uuid",
  "processors": [
    { "id": "uuid-1", "position": 1 },
    { "id": "uuid-2", "position": 2 },
    { "id": "uuid-3", "position": 3 }
  ]
}
```

- **Errores posibles:** `400` (ids inválidos/duplicados), `404` (pipeline o processor inexistente), `409` (lista inconsistente), `500`.

---

## 4) Notas de compatibilidad relevantes

- El backend actual usa UUID en entidades principales (`pipelines`, `processors`, `pipelineprocessors`, `sources`, `mappings`).
- `POST /mappings` actualmente recibe un array JSON plano (`[]`) y reemplaza el mapping completo.
- `GET /processors` devuelve `schema` (JSON dinámico), que el frontend usa para renderizar formularios dinámicos.
