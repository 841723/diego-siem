# APIS_FALTANTES.md

Estado analizado contra:
- Backend actual (`/backend/internal/routes`, `/backend/internal/storage`, `postgres/init.sql`)
- Frontend actual (`/frontend/src`)
- Nuevas funcionalidades implementadas en frontend (Pipelines completos + Rules + Alerts)

## 1) Pipeline processors: catálogo dinámico (faltante crítico)

### `GET /processors`
- **Descripción**: Devuelve todos los tipos de processor disponibles para construir formularios dinámicos (sin hardcode).
- **Request body**: _sin body_
- **Response 200 (ejemplo)**:
```json
[
  {
    "id": "cf01f20a-4fb6-4ddb-ae76-b5b44c8d697c",
    "name": "set",
    "description": "Sets a value for a field",
    "schema": {
      "destination_field": "string",
      "value": "string"
    }
  }
]
```
- **Errores**:
  - `500`: error interno consultando tabla `processor`.

---

## 2) Pipeline processors: persistencia de orden (faltante)

Actualmente existe CRUD de processors por pipeline (`GET/POST/PUT/DELETE /pipelines/:id/processors`), pero no contrato explícito para orden estable.

### `PUT /pipelines/:id/processors/reorder`
- **Descripción**: Reordena processors del pipeline con orden determinístico.
- **Request body (ejemplo)**:
```json
{
  "processors": [
    { "id": "proc-uuid-1", "position": 0 },
    { "id": "proc-uuid-2", "position": 1 }
  ]
}
```
- **Response 200 (ejemplo)**:
```json
{ "message": "processors reordered" }
```
- **Errores**:
  - `400`: payload inválido o posiciones duplicadas.
  - `404`: pipeline o processor no encontrado.
  - `409`: conflicto de versión/orden.
  - `500`: error interno.

> Alternativa equivalente aceptable: `PUT /pipelines/:id/processors` (replace completo en orden).

---

## 3) Rules: catálogo de tipos y schemas (faltante crítico)

### `GET /rules/types`
- **Descripción**: Devuelve tipos de regla y schema dinámico por tipo.
- **Request body**: _sin body_
- **Response 200 (ejemplo)**:
```json
[
  {
    "type": "threshold",
    "label": "Threshold",
    "description": "Dispara al superar un umbral",
    "schema": {
      "query": "string",
      "window_minutes": "number",
      "threshold": "number",
      "group_by": "array"
    }
  },
  {
    "type": "correlation",
    "label": "Correlation",
    "description": "Correlaciona múltiples condiciones",
    "schema": {
      "steps": "array",
      "window_minutes": "number"
    }
  }
]
```
- **Errores**:
  - `500`: error interno.

---

## 4) Rules CRUD (faltante crítico)

## `GET /rules`
- **Descripción**: Lista reglas para la tabla principal.
- **Request body**: _sin body_
- **Response 200 (ejemplo)**:
```json
[
  {
    "id": "rule-uuid",
    "name": "SSH brute force",
    "description": "Demasiados intentos fallidos",
    "enabled": true,
    "type": "threshold",
    "severity": "high",
    "config": {
      "query": "event.action=login_failed",
      "threshold": 10,
      "window_minutes": 5
    },
    "last_execution_at": "2026-05-07T18:00:00Z",
    "created_at": "2026-05-07T17:30:00Z",
    "updated_at": "2026-05-07T17:45:00Z"
  }
]
```
- **Errores**:
  - `500`: error interno.

## `GET /rules/:id`
- **Descripción**: Obtiene detalle de una regla para edición.
- **Request body**: _sin body_
- **Response 200**: mismo shape de `Rule`.
- **Errores**:
  - `400`: ID inválido.
  - `404`: regla no encontrada.
  - `500`: error interno.

## `POST /rules`
- **Descripción**: Crea una regla.
- **Request body (ejemplo)**:
```json
{
  "name": "SSH brute force",
  "description": "Demasiados intentos fallidos",
  "enabled": true,
  "type": "threshold",
  "severity": "high",
  "config": {
    "query": "event.action=login_failed",
    "threshold": 10,
    "window_minutes": 5
  }
}
```
- **Response 201**: objeto `Rule` completo.
- **Errores**:
  - `400`: validación (campos requeridos, schema inválido para `type`).
  - `409`: nombre duplicado.
  - `500`: error interno.

## `PUT /rules/:id`
- **Descripción**: Actualiza regla existente.
- **Request body**: mismo shape de creación.
- **Response 200**: objeto `Rule` actualizado.
- **Errores**:
  - `400`: validación/ID inválido.
  - `404`: regla no encontrada.
  - `409`: conflicto (ej. nombre duplicado).
  - `500`: error interno.

## `DELETE /rules/:id`
- **Descripción**: Elimina regla.
- **Request body**: _sin body_
- **Response 200 (ejemplo)**:
```json
{ "message": "rule deleted" }
```
- **Errores**:
  - `400`: ID inválido.
  - `404`: regla no encontrada.
  - `500`: error interno.

---

## 5) Alertas de reglas (faltante crítico)

### `GET /rules/alerts`
- **Descripción**: Lista alertas generadas por reglas.
- **Request body**: _sin body_
- **Response 200 (ejemplo)**:
```json
[
  {
    "id": "alert-uuid",
    "timestamp": "2026-05-07T18:10:00Z",
    "rule_id": "rule-uuid",
    "rule_name": "SSH brute force",
    "severity": "high",
    "message": "15 intentos fallidos en 5 minutos",
    "status": "open",
    "details": {
      "source_ip": "10.0.0.9",
      "count": 15
    }
  }
]
```
- **Errores**:
  - `500`: error interno.

---

## 6) Ajustes de contrato recomendados (inconsistencias detectadas)

No son endpoints nuevos, pero sí faltan para evitar errores de integración:

1. **Alinear contrato de `PipelineProcessor`**:
   - Backend usa simultáneamente referencias a `processorid` y a `type` en distintas capas.
   - Definir un único contrato público estable (recomendado: `type` + `config` + `id` + `pipelineid`).

2. **Normalizar `config` como JSON objeto**:
   - Responder y aceptar siempre `config` como objeto JSON (no string serializado).

3. **Orden de salida en `GET /pipelines/:id/processors`**:
   - Incluir orden explícito (`position`) o garantizar `ORDER BY position`.

---

## 7) Endpoints ya disponibles y usados por frontend (no faltantes)

- `GET/POST/PUT/DELETE /pipelines` y `GET /pipelines/:id`
- `GET/POST/PUT/DELETE /pipelines/:id/processors`
- `GET/POST /mappings`
- `GET /mappings/types`
- `GET/POST/PUT/DELETE /sources` y `GET /sources/:id`
- `POST /logs/:sourceId`

> Nota: este archivo documenta únicamente APIs faltantes o ajustes de contrato necesarios para cerrar totalmente la integración del frontend actual.
