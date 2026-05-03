# APIs faltantes / pendientes — frontend SIEM

Este documento refleja el estado actual de la integración frontend↔backend.
Todos los IDs son UUIDs (string), no enteros.

---

## ✅ Endpoints ya disponibles y consumidos

| Método   | Ruta              | Descripción                                  |
| -------- | ----------------- | -------------------------------------------- |
| `GET`    | `/sources`        | Lista fuentes                                |
| `POST`   | `/sources`        | Crea una fuente                              |
| `GET`    | `/sources/:id`    | Detalle de una fuente                        |
| `PUT`    | `/sources/:id`    | Actualiza una fuente                         |
| `DELETE` | `/sources/:id`    | Elimina una fuente                           |
| `POST`   | `/logs/:sourceId` | Consulta logs de una fuente (con paginación) |
| `GET`    | `/pipelines`      | Lista pipelines                              |
| `POST`   | `/pipelines`      | Crea un pipeline                             |
| `GET`    | `/pipelines/:id`  | Detalle de un pipeline                       |
| `PUT`    | `/pipelines/:id`  | Actualiza un pipeline                        |
| `DELETE` | `/pipelines/:id`  | Elimina un pipeline                          |
| `GET`    | `/mappings`       | Lee el mapping global (lista de campos)      |
| `POST`   | `/mappings`       | Reemplaza el mapping global completo         |

---

## ❌ Endpoints pendientes de implementar en el backend

### Procesadores de pipeline

#### `GET /processors`

Devuelve los tipos de procesador disponibles con su esquema de configuración.
El frontend usa una lista hardcodeada como fallback mientras este endpoint no exista.

Response esperado:

```json
[
    {
        "id": "set",
        "name": "set",
        "description": "Establece un valor en un campo",
        "config": {
            "field": "string",
            "value": "string"
        }
    },
    {
        "id": "drop",
        "name": "drop",
        "description": "Descarta el evento",
        "config": {}
    },
    {
        "id": "copy",
        "name": "copy",
        "description": "Copia un campo a otro",
        "config": {
            "source_field": "string",
            "destination_field": "string"
        }
    }
]
```

#### `GET /pipelines/:id/processors`

Devuelve los procesadores configurados para un pipeline concreto.
Necesario para mostrarlos en la vista de detalle del pipeline.

Response esperado:

```json
[
    {
        "id": "uuid",
        "pipelineid": "uuid",
        "type": "set",
        "config": "{\"field\":\"host\",\"value\":\"unknown\"}"
    }
]
```

#### `POST /pipelines/:id/processors`

Reemplaza la lista de procesadores de un pipeline.
Necesario para persistir los procesadores desde el formulario de edición.

Request:

```json
[
    { "type": "set", "config": "{\"field\":\"host\",\"value\":\"unknown\"}" },
    { "type": "lowercase", "config": "{\"field\":\"severity\"}" }
]
```

---

### Tipos de campo del mapping

#### `GET /mappings/types`

Devuelve los tipos de campo disponibles para el mapping global.
El frontend usa tipos hardcodeados como fallback mientras este endpoint no exista.

Response esperado:

```json
[
    { "id": "uuid-1", "type_name": "string" },
    { "id": "uuid-2", "type_name": "integer" },
    { "id": "uuid-3", "type_name": "decimal" },
    { "id": "uuid-4", "type_name": "boolean" },
    { "id": "uuid-5", "type_name": "date" },
    { "id": "uuid-6", "type_name": "ip" },
    { "id": "uuid-7", "type_name": "timestamp" }
]
```

---

### Alertas / Reglas (futuro)

#### `GET /rules`, `POST /rules`, `PATCH /rules/:id`

Para un módulo de alertas automáticas basadas en consultas sobre los logs.
No hay página en el frontend todavía.

---

## Notas

- El campo `config` de `PipelineProcessor` es un JSON string serializado, no un objeto JSON.
- El endpoint `POST /mappings` acepta `{ Mapping: [...] }` (objeto con clave `Mapping`) y reemplaza
  **toda** la colección de campos del mapping global en una sola operación.
