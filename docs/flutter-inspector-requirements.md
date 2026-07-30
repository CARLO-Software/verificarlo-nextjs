# Requerimientos Flutter — App del Inspector/Mecánico VerifiCARLO

La app móvil y la web comparten la **misma base de datos PostgreSQL** y el **mismo backend Next.js**. La app Flutter consume las APIs existentes — no es un sistema separado, es una extensión móvil del mismo sistema. El login autentica contra la misma tabla `User`, y todas las operaciones (inspecciones, reportes, fotos, notificaciones) leen y escriben en las mismas tablas que usa la web.

Este documento cubre exclusivamente el flujo del inspector/mecánico.

---

## 1. ARQUITECTURA FLUTTER

```
lib/
├── main.dart
├── app.dart                          # MaterialApp, rutas, tema
│
├── core/
│   ├── constants/
│   │   ├── api_endpoints.dart        # Todas las URLs del backend
│   │   ├── inspection_constants.dart # Slots, feriados, timezone
│   │   └── app_colors.dart
│   ├── network/
│   │   ├── api_client.dart           # Dio/http wrapper con interceptors
│   │   ├── auth_interceptor.dart     # Inyecta token en cada request
│   │   └── api_exception.dart        # Manejo de errores HTTP
│   └── storage/
│       └── local_storage.dart        # SharedPreferences / Hive para offline
│
├── data/
│   ├── models/                       # Data classes (fromJson/toJson)
│   │   ├── user_model.dart
│   │   ├── booking_model.dart
│   │   ├── vehicle_model.dart
│   │   ├── vehicle_inspection_model.dart
│   │   ├── inspection_report_model.dart
│   │   ├── inspection_photo_model.dart
│   │   ├── notification_model.dart
│   │   └── checklist_models.dart     # InspectionCategory, InspectionItem, ItemResult
│   └── repositories/                 # Acceso a datos (API + cache local)
│       ├── auth_repository.dart
│       ├── inspection_repository.dart
│       ├── report_repository.dart
│       ├── photo_repository.dart
│       ├── schedule_repository.dart
│       └── notification_repository.dart
│
├── domain/
│   └── services/                     # Lógica de negocio pura
│       ├── checklist_service.dart    # Scoring, progreso, validaciones
│       ├── verdict_service.dart      # Cálculo de veredicto (APROBADO/OBSERVADO/NO_APROBADO)
│       └── sync_service.dart         # Sincronización offline → servidor
│
├── presentation/
│   ├── controllers/                  # State management (Riverpod/Bloc/GetX)
│   │   ├── auth_controller.dart
│   │   ├── dashboard_controller.dart
│   │   ├── inspection_controller.dart
│   │   ├── checklist_controller.dart # Autoguardado, estado de ítems
│   │   ├── photo_controller.dart
│   │   ├── schedule_controller.dart
│   │   └── notification_controller.dart
│   ├── screens/
│   │   ├── login/
│   │   ├── dashboard/                # Lista de inspecciones pendientes/completadas
│   │   ├── schedule/                 # Agenda del inspector
│   │   ├── inspection/               # Formulario de inspección (3 tabs)
│   │   │   ├── info_tab.dart
│   │   │   ├── checklist_tab.dart
│   │   │   └── summary_tab.dart
│   │   └── settings/                 # Configuración y cambio de contraseña
│   └── widgets/                      # Componentes reutilizables
│       ├── inspection_card.dart
│       ├── checklist_item_card.dart
│       ├── status_buttons.dart       # OK / Observación / Defecto / No aplica
│       ├── comment_chips.dart        # Chips predefinidos de comentarios
│       ├── photo_capture.dart        # Cámara + galería
│       ├── voice_button.dart         # Speech-to-text
│       ├── score_circle.dart         # Indicador circular de score
│       └── notification_bell.dart
│
└── config/
    ├── routes.dart
    └── theme.dart
```

### Flujo de datos

```
Screen → Controller → Service (lógica) → Repository (API + cache) → ApiClient (HTTP)
```

- **Repository**: único punto de acceso a datos. Decide si leer de cache local o llamar al API. Retorna models.
- **Service**: lógica de negocio pura sin dependencias de UI ni red. Scoring, validaciones, cálculos de veredicto.
- **Controller**: maneja estado de la UI. Conecta screens con services/repositories. Expone streams/states.
- **Screen/Widget**: solo renderiza lo que el controller le da. Sin lógica de negocio.

### Offline-first (checklist)

```
Usuario marca ítem → Controller actualiza estado local → Guarda en Hive/SQLite inmediatamente
                                                       → Debounce 500ms → Repository.syncChecklist()
                                                                          ├── OK → limpia cache local
                                                                          └── Error → mantiene en cola de sync
```

Al abrir la app: `SyncService` revisa si hay cambios pendientes y los envía.

---

## 2. AUTENTICACIÓN (Base de datos compartida)

### Login

La app autentica contra la **misma tabla `User`** de PostgreSQL que usa la web. El inspector usa email/password (credenciales con bcrypt). La sesión de la app móvil es independiente de la sesión web — el inspector puede estar logueado en ambas simultáneamente.

> **Nota**: La web usa NextAuth con sessions en DB. Para la app Flutter se necesita exponer un endpoint de login que retorne un **JWT o token de sesión** que la app pueda almacenar y enviar en cada request. Este endpoint puede reutilizar la misma validación de credenciales (bcrypt) que ya existe en `lib/auth.ts`.

**Tabla `User` (compartida con la web) — campos relevantes para el inspector:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `String` (cuid) | ID único, mismo en web y app |
| `name` | `String` | Nombre completo |
| `email` | `String` (unique) | Email — mismo login que la web |
| `phone` | `String?` | Teléfono para WhatsApp |
| `image` | `String?` | Avatar |
| `password` | `String?` | Hash bcrypt — null si es cuenta Google-only |
| `role` | `INSPECTOR` | Debe ser INSPECTOR para acceder a la app |
| `status` | `ACTIVE` / `SUSPENDED` | Si SUSPENDED, denegar acceso |
| `isInspectorAvailable` | `bool` | Disponibilidad para recibir asignaciones |
| `availability` | `Json?` | Horarios: `{"lunes": ["09:00-13:00", "14:00-18:00"], ...}` |

### Validaciones al login

1. Verificar que `email` existe en la tabla `User`
2. Verificar `password` con bcrypt
3. Verificar `role = INSPECTOR` (o `ADMIN`) — rechazar clientes
4. Verificar `status = ACTIVE` — mostrar mensaje si `SUSPENDED`
5. Retornar token + datos del usuario

---

## 3. FLUJO DUAL DE INSPECCIÓN

Cuando un pago se confirma, el backend crea un `VehicleInspection` con dos procesos independientes:

```
┌─────────────────────────────────────────────────────────────┐
│                    VehicleInspection                        │
│                                                             │
│  MECÁNICO (Inspector)          LEGAL (Admin web)            │
│  PENDIENTE → EN_PROCESO        BLOQUEADO → PENDIENTE        │
│  EN_PROCESO → COMPLETADO       PENDIENTE → EN_PROCESO       │
│                                EN_PROCESO → COMPLETADO      │
│                                                             │
│  Ambos corren en PARALELO e independientemente              │
└─────────────────────────────────────────────────────────────┘
```

El inspector solo controla el track **mecánico**. El track **legal** lo maneja el admin desde la web.

### Acciones del inspector

**`PATCH /api/vehicle-inspections/[id]/mechanic`**

| Action | Transición | Datos extra |
|--------|-----------|-------------|
| `"start"` | `PENDIENTE → EN_PROCESO` | — |
| `"complete"` | `EN_PROCESO → COMPLETADO` | `notes?` opcional |
| `"register_plate"` | Registra placa. Si legal estaba `BLOQUEADO` → pasa a `PENDIENTE` | `plate` requerido |

---

## 4. DASHBOARD DEL INSPECTOR

### Datos que muestra

**Inspecciones pendientes** (bookings con `status=PAID` asignados al inspector):

| Dato | Fuente |
|------|--------|
| Código | `#INS-{año}-{id padded 4 dígitos}` (ej: `#INS-2026-0042`) |
| Vehículo | marca + modelo + año |
| Placa | `Vehicle.plate` (puede ser null) |
| Cliente | nombre, teléfono, email |
| Plan | tipo + título |
| Fecha/hora | `date`, `timeSlot`, `startTime` |
| Estado reporte | si tiene reporte: id, overallStatus, completedAt |

**Inspecciones completadas** (bookings con `status=COMPLETED`).

### UI

- Saludo: "Hola, {nombre}" + fecha actual (es-PE)
- Stats: inspecciones de hoy + total pendientes
- Banner "próxima inspección" con countdown
- **Tabs**: Pendientes ({count}) | Completadas ({count})
- Agrupadas por fecha: "Hoy", "Mañana", "En X días"
- Cada tarjeta:
  - Hora (12h AM/PM)
  - Indicador urgente (punto rojo si < 60 min)
  - Vehículo, cliente, plan, placa (monoespaciada)
  - Badge: "Pendiente" (gris) / "En progreso" (amarillo) / "Completado" (verde)
- Acciones pendientes: llamar (`tel:`), WhatsApp (mensaje pre-llenado), "Iniciar"/"Continuar"
- Acciones completadas: "Ver reporte"

### API

**`GET /api/reports?status=pending|completed`** — lista inspecciones del inspector

---

## 5. AGENDA DEL INSPECTOR

### `GET /api/inspector/schedule`

| Param | Default | Descripción |
|-------|---------|-------------|
| `date` | — | Día específico (YYYY-MM-DD) |
| `days` | 7 | Rango desde hoy |

Respuesta agrupada por fecha:

```json
{
  "inspector": "Nombre",
  "range": { "from": "...", "to": "..." },
  "totalBookings": 5,
  "schedule": {
    "2026-03-25": [
      {
        "id": 42,
        "timeSlot": "10:00",
        "status": "PAID",
        "client": { "name": "...", "phone": "...", "email": "..." },
        "inspection": { "title": "Inspección Completa", "type": "completa" },
        "vehicle": { "brand": "Toyota", "model": "Corolla", "year": 2019, "plate": "ABC-123", "mileage": 45000 },
        "clientNotes": "..."
      }
    ]
  }
}
```

### `PATCH /api/inspector/schedule`

Body: `{ bookingId, action, notes? }`

| Action | Efecto |
|--------|--------|
| `"complete"` | Marca booking como `COMPLETED` (solo si `PAID`) |
| `"no_show"` | Marca booking como `NO_SHOW` (solo si `PAID`) |

---

## 6. FORMULARIO DE INSPECCIÓN — 3 TABS

### Tab 1: Información

**Registro de placa** (solo si el vehículo no tiene placa):
- Formato peruano: 3 letras + guión + 3 números (ej: ABC-123)
- API: `PATCH /api/vehicle-inspections/{id}/mechanic` con `action: "register_plate"`
- Si `legalStatus` es `BLOQUEADO`: mostrar warning "Revisión legal bloqueada hasta registrar placa"

**Datos de solo lectura**: vehículo (marca, modelo, año), placa, kilometraje declarado, plan, cliente (nombre + teléfono clickeable), fecha/hora, lista de ítems del plan.

### Tab 2: Checklist de Inspección

#### 4 categorías (tabs horizontales scrolleables)

1. **Legal** (icono documento) — 11 ítems
2. **Mecánica** (icono motor) — 18 ítems
3. **Carrocería** (icono auto) — 12 ítems
4. **Interior** (icono asiento) — 13 ítems

Cada tab muestra badge de progreso (ej: "7/11").

#### Barra de progreso

- General: X/Y ítems (Z%)
- Por categoría en header móvil

#### Por sección

- Header con número o checkmark (si completa)
- Botón **"Todo OK"**: marca todos los sin estado como OK
- Contador de progreso

#### Por ítem

- Label del ítem
- **4 botones de estado** (o **3 para Legal** — sin "Defecto"):
  - OK (verde) / Observación (amarillo) / Defecto (rojo) / No aplica (gris)
  - Click en el mismo estado → deselecciona

**Comentario** (se abre auto para Observación/Defecto):
- Chips predefinidos (toggle):
  - **Observación**: "Desgaste normal", "Requiere atención pronto", "Suciedad visible", "Ligero ruido", "Pequeña fuga", "Revisión recomendada"
  - **Defecto**: "Requiere cambio inmediato", "No funciona", "Daño estructural", "Fuga severa", "Riesgo de seguridad", "Reparación mayor requerida"
- Textarea libre
- **Botón de voz** (speech-to-text en es-PE)

**Fotos por ítem** (para OK, Observación, Defecto):
- Cámara trasera + galería
- Max 5 fotos por ítem (ilimitado para pintura)
- Max 10MB por imagen
- Grid de thumbnails, lightbox, eliminar con confirmación
- API subida: `POST /api/reports/{id}/photos/upload` (FormData: `file`, `checklistItemId?`, `label?`)
- API eliminar: `DELETE /api/photos/{id}`

#### Autoguardado

- Debounce 500ms tras inactividad → `PATCH /api/reports/{id}/sections`
- Backup local (Hive/SQLite) inmediato antes de sincronizar
- Al perder conexión: mantener en cola, sincronizar al recuperar
- Indicador flotante: "Guardando..." / "Guardado"
- Confirmación al salir si hay cambios pendientes

#### Navegación entre categorías

Cuando una categoría está 100%, muestra "Categoría completada" con botones Anterior/Siguiente.

### Tab 3: Resumen

**Score general**: Círculo con score (X/100) y color:
- Pendiente (gris) / Aprobado (verde) / Observaciones (amarillo) / Crítico (rojo)

**Grid por categoría**: score, estado, desglose (OK/Obs/Def)

**Campos editables**:
- Kilometraje real (odómetro)
- Resumen ejecutivo (textarea con dictado por voz)
- Costo estimado de reparación (S/)

**Veredicto** (solo si no completado):
- Checkboxes de hallazgos críticos:
  - "El vehículo ha tenido un siniestro (choque)"
  - "El kilometraje está adulterado"
  - Si cualquiera marcado → fuerza `NO_APROBADO`
- Radio de veredicto: `APROBADO` / `OBSERVADO` / `NO_APROBADO`

**Finalizar**: `POST /api/reports/{id}/complete`
- Validaciones: todas las categorías iniciadas, veredicto seleccionado, placa registrada
- Si falta placa: modal dirigiendo al Tab 1

**Estado completado**: solo lectura, mensaje "Este informe ha sido completado y no puede modificarse"

---

## 7. CHECKLIST COMPLETO — TODOS LOS ÍTEMS

### LEGAL (11 ítems) — Sin opción DEFECTO

**Documentación (6):**

| ID | Label |
|----|-------|
| `legal-tarjeta-propiedad` | Tarjeta de propiedad |
| `legal-revision-tecnica` | Certificado de revisión técnica vehicular |
| `legal-soat` | SOAT vigente |
| `legal-permiso-lunas` | Permiso de lunas polarizadas |
| `legal-manual-instrucciones` | Manual de instrucciones |
| `legal-cartilla-servicio` | Cartilla de servicio |

**Identificación (1):**

| ID | Label |
|----|-------|
| `legal-vin-placa` | Coincidencia VIN / placa |

**Accesorios obligatorios (4):**

| ID | Label |
|----|-------|
| `legal-llaves` | 2 llaves disponibles |
| `legal-llanta-repuesto` | Llanta de repuesto con herramientas |
| `legal-tapa-maletera` | Tapa de maletera |
| `legal-seguro-aros` | Seguro de aros |

### MECÁNICA (18 ítems)

**Motor (9):**

| ID | Label |
|----|-------|
| `mec-sonidos-motor` | Sonidos del motor |
| `mec-fugas-aceite` | Fugas de aceite |
| `mec-fugas-refrigerante` | Fugas de refrigerante |
| `mec-prueba-gas` | Prueba de gas |
| `mec-nivel-aceite-motor` | Nivel de aceite motor |
| `mec-nivel-aceite-caja` | Nivel de aceite de caja |
| `mec-nivel-refrigerante` | Nivel de refrigerante |
| `mec-sin-manipulacion` | Motor sin señales de manipulación |
| `mec-estado-bateria` | Estado de batería |

**Parte inferior (4):**

| ID | Label |
|----|-------|
| `mec-fugas-inferiores` | Fugas inferiores de motor o transmisión |
| `mec-golpes-suspension` | Golpes en suspensión o estructura inferior |
| `mec-tubo-escape` | Estado del tubo de escape |
| `mec-oxido-estructural` | Señales de óxido estructural |

**Suspensión y dirección (2):**

| ID | Label |
|----|-------|
| `mec-funcionamiento-suspension` | Estado de suspensión |
| `mec-direccion` | Dirección |

**Frenos (1):**

| ID | Label |
|----|-------|
| `mec-funcionamiento-frenos` | Funcionamiento de frenos |

**Prueba de ruta (3):**

| ID | Label |
|----|-------|
| `mec-vibracion-ruido-freno` | Vibración o ruido al frenar |
| `mec-funcionamiento-caja` | Funcionamiento de transmisión |
| `mec-comportamiento-conduccion` | Comportamiento general en conducción |

### CARROCERÍA (12 ítems)

**Estructura y alineación (3):**

| ID | Label |
|----|-------|
| `car-alineacion-puertas` | Alineación de puertas, capot y carrocería |
| `car-senales-accidentes` | Señales de accidentes o reparaciones |
| `car-soldaduras-intervenciones` | Soldaduras o intervenciones estructurales visibles |

**Pintura y superficie (2):**

| ID | Label |
|----|-------|
| `car-estado-pintura` | Estado general de pintura |
| `car-rayones-golpes` | Rayones o golpes visibles |

**Lunas y parabrisas (2):**

| ID | Label |
|----|-------|
| `car-estado-parabrisas` | Estado del parabrisas |
| `car-lunas-laterales-trasera` | Estado de lunas laterales y trasera |

**Luces exteriores (3):**

| ID | Label |
|----|-------|
| `car-faros-delanteros` | Faros delanteros |
| `car-faros-traseros` | Faros traseros |
| `car-focos-halogenados` | Focos halógenos reglamentarios |

**Neumáticos y aros (2):**

| ID | Label |
|----|-------|
| `car-estado-neumaticos` | Estado de neumáticos |
| `car-estado-aros` | Estado de aros |

### INTERIOR (13 ítems)

**Sistemas funcionales (7):**

| ID | Label |
|----|-------|
| `int-revision-scanner` | Resultado de revisión de scanner |
| `int-panel-multimedia` | Funcionamiento de panel central / multimedia |
| `int-comando-luces` | Funcionamiento de comando de luces |
| `int-aire-acondicionado` | Funcionamiento de aire acondicionado |
| `int-elevalunas` | Funcionamiento de elevalunas |
| `int-limpia-parabrisas` | Funcionamiento de limpia parabrisas |
| `int-asientos` | Funcionalidad de asientos |

**Seguridad interior (2):**

| ID | Label |
|----|-------|
| `int-cinturones` | Cinturones de seguridad |
| `int-testigos-airbag` | Testigos de tablero |

**Estética interior (4):**

| ID | Label |
|----|-------|
| `int-estado-molduras` | Estado de molduras |
| `int-desgaste-asientos` | Desgaste de asientos |
| `int-estado-alfombra` | Estado de alfombra |
| `int-estado-techo` | Estado de techo |

---

## 8. ESTADOS Y SCORING

### Estados por ítem

| Estado | Valor | Puntos |
|--------|-------|--------|
| OK | `"OK"` | 100 |
| Observación | `"OBSERVACION"` | 50 |
| Defecto | `"DEFECTO"` | 0 |
| No aplica | `"NO_APLICA"` | No cuenta |

### Formato de guardado

```json
{
  "legal-tarjeta-propiedad": { "status": "OK", "comment": null },
  "mec-sonidos-motor": { "status": "OBSERVACION", "comment": "Ligero ruido al ralentí" },
  "car-estado-pintura": { "status": "DEFECTO", "comment": "Pintura descascarada en capot" }
}
```

### Scoring por categoría

```
Score = (OK × 100 + OBSERVACION × 50) / (OK + OBSERVACION + DEFECTO)
```

| Condición | Status |
|-----------|--------|
| Tiene DEFECTO | `CRITICAL` |
| Tiene OBSERVACION (sin DEFECTO) | `WARNING` |
| Todo OK | `OK` |

### Score general

Promedio de las 4 categorías. Status general = el peor de todos.

Pesos documentados en la UI:
- Legal: 30%
- Mecánica: 40%
- Carrocería: 30%

### Veredictos del mecánico

| Veredicto | Significado | Color |
|-----------|------------|-------|
| `APROBADO` | Vehículo en óptimas condiciones | Verde |
| `OBSERVADO` | Defectos menores encontrados | Amarillo |
| `NO_APROBADO` | Siniestro o kilometraje adulterado | Rojo |

### Grado de inspección (1-4 estrellas, manual)

| Grado | Significado |
|-------|-------------|
| 1 | Crítico |
| 2 | Observaciones importantes |
| 3 | Observaciones menores |
| 4 | Excelente |

---

## 9. FINALIZAR INFORME

### `POST /api/reports/[id]/complete`

```json
{
  "mechanicalVerdict": "APROBADO",
  "hasSiniestro": false,
  "hasKilometrajeAdulterado": false,
  "executiveSummary": "Texto libre del inspector",
  "estimatedRepairCost": 2500.00,
  "mileageAtInspection": 45000
}
```

### Reglas de negocio

1. Si `hasSiniestro` o `hasKilometrajeAdulterado` → fuerza `NO_APROBADO`
2. Veredicto obligatorio (no puede ser PENDING)
3. Checklist debe tener ítems completados
4. **Todas las 4 categorías** deben tener al menos un ítem completado
5. Scores se calculan automáticamente desde el checklist
6. Marca booking como `COMPLETED`
7. Actualiza `VehicleInspection.mechanicalStatus → COMPLETADO`
8. Genera firma digital: `"Firmado digitalmente por {nombre} - {timestamp}"`
9. Backend genera PDF y lo sube a Cloudinary (background)
10. Backend crea LegalReport y notifica a admins (background)

---

## 10. FOTOS DE INSPECCIÓN

### Subir foto

**`POST /api/reports/[id]/photos/upload`** (FormData)

| Campo | Tipo | Requerido |
|-------|------|-----------|
| `file` | imagen (max 10MB) | Sí |
| `checklistItemId` | String | No |
| `label` | String | No |

- Solo inspector asignado o admin
- No se puede subir a informe finalizado
- Backend sube a Cloudinary, genera thumbnail 200×200, convierte a WebP max 1200px

### Eliminar foto

**`DELETE /api/photos/[id]`** — también elimina de Cloudinary

### Categorías de fotos

| Categoría | Descripción |
|-----------|-------------|
| `EXTERIOR_FRONT` | Frente del vehículo |
| `EXTERIOR_BACK` | Parte trasera |
| `EXTERIOR_LEFT` | Lado izquierdo |
| `EXTERIOR_RIGHT` | Lado derecho |
| `INTERIOR_DASHBOARD` | Tablero/odómetro |
| `INTERIOR_SEATS` | Asientos |
| `INTERIOR_TRUNK` | Maletero |
| `ENGINE` | Motor |
| `TIRES` | Llantas |
| `DOCUMENTS` | Documentos |
| `DAMAGE` | Daños encontrados (default) |
| `OTHER` | Otros |

---

## 11. NOTIFICACIONES

### Endpoints

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/notifications` | GET | Obtener notificaciones (`?unread=true`, `?limit=20`) |
| `/api/notifications/[id]/read` | PATCH | Marcar como leída |
| `/api/notifications/all/read` | PATCH | Marcar todas como leídas |
| `/api/notifications/[id]` | DELETE | Eliminar |

### Tipo que recibe el inspector

| Tipo | Descripción |
|------|-------------|
| `MECANICO_ASIGNADO` | Nueva inspección asignada |

### UI

- Polling cada 30 segundos (o push con Firebase en la app)
- Agrupadas: "En la próxima hora", "Hoy", "Esta semana", "Anteriores"
- Badge con conteo de no leídas
- Click navega al formulario de inspección

---

## 12. CONFIGURACIÓN DEL INSPECTOR

- Cambio de contraseña: `POST /api/user/change-password`
  - Validación: 8+ chars, mayúscula, minúscula, número, carácter especial
  - No disponible si es cuenta Google-only
- Perfil: `GET/PATCH /api/user/profile`

---

## 13. CONSTANTES

```dart
const timezone = "America/Lima"; // UTC-5
const inspectionDurationMinutes = 60;

const weekdaySlots = ["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00"];
const saturdaySlots = ["09:00","10:00","11:00","12:00"];
// Domingo: sin servicio

const feriadosFijos = [
  "01-01", // Año Nuevo
  "05-01", // Día del Trabajo
  "06-29", // San Pedro y San Pablo
  "07-28", // Fiestas Patrias
  "07-29", // Fiestas Patrias
  "08-30", // Santa Rosa de Lima
  "10-08", // Combate de Angamos
  "11-01", // Día de Todos los Santos
  "12-08", // Inmaculada Concepción
  "12-25", // Navidad
];
```

---

## 14. TODAS LAS APIs (mismo backend Next.js, misma DB)

> Todas estas rutas ya existen en el backend web. La app Flutter las consume directamente. El único endpoint nuevo a crear es el de login con JWT para la app móvil.

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/login` | POST | Login con credenciales — **necesita adaptarse para retornar JWT** |
| `/api/vehicle-inspections` | GET | Lista inspecciones asignadas al inspector |
| `/api/vehicle-inspections/[id]/mechanic` | PATCH | Iniciar, completar inspección o registrar placa |
| `/api/inspector/schedule` | GET | Agenda del inspector |
| `/api/inspector/schedule` | PATCH | Marcar complete / no_show |
| `/api/reports` | POST | Crear informe (`{ bookingId }`) |
| `/api/reports` | GET | Listar inspecciones pendientes/completadas |
| `/api/reports/[id]` | GET | Obtener informe completo con fotos |
| `/api/reports/[id]` | PATCH | Actualizar informe |
| `/api/reports/[id]/sections` | PATCH | Guardar checklist (`{ section, data }`) |
| `/api/reports/[id]/complete` | POST | Finalizar informe con veredicto |
| `/api/reports/[id]/photos/upload` | POST | Subir foto (FormData) |
| `/api/photos/[id]` | DELETE | Eliminar foto |
| `/api/notifications` | GET | Obtener notificaciones |
| `/api/notifications/[id]/read` | PATCH | Marcar leída |
| `/api/notifications/all/read` | PATCH | Marcar todas leídas |
| `/api/notifications/[id]` | DELETE | Eliminar notificación |
| `/api/user/change-password` | POST | Cambiar contraseña |
| `/api/user/profile` | GET/PATCH | Ver/editar perfil |

---

## 15. NAVEGACIÓN

```
Login
  └── Dashboard (inspecciones pendientes/completadas)
        ├── Inspección #{id}
        │     ├── Tab 1: Información (datos, registrar placa)
        │     ├── Tab 2: Checklist (Legal → Mecánica → Carrocería → Interior)
        │     ├── Tab 3: Resumen (scores, veredicto, finalizar)
        │     └── ← Volver al Dashboard
        ├── Agenda (calendario con inspecciones por día)
        ├── Notificaciones → navega a inspección
        ├── Configuración (contraseña, perfil)
        └── Cerrar sesión → Login
```

---

## 16. ENUMS DE REFERENCIA

| Enum | Valores |
|------|---------|
| `BookingStatus` | `PENDING_PAYMENT`, `PENDING_VERIFICATION`, `PAID`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `EXPIRED` |
| `MechanicalStatus` | `PENDIENTE`, `EN_PROCESO`, `COMPLETADO` |
| `LegalStatus` | `BLOQUEADO`, `PENDIENTE`, `EN_PROCESO`, `COMPLETADO` |
| `MechanicalVerdict` | `PENDING`, `APROBADO`, `OBSERVADO`, `NO_APROBADO` |
| `InspectionResultStatus` | `PENDING`, `OK`, `WARNING`, `CRITICAL` |
| `InspectionStatus` (checklist) | `OK`, `OBSERVACION`, `DEFECTO`, `NO_APLICA` |
| `PhotoCategory` | `EXTERIOR_FRONT`, `EXTERIOR_BACK`, `EXTERIOR_LEFT`, `EXTERIOR_RIGHT`, `INTERIOR_DASHBOARD`, `INTERIOR_SEATS`, `INTERIOR_TRUNK`, `ENGINE`, `TIRES`, `DOCUMENTS`, `DAMAGE`, `OTHER` |
| `NotificationType` | `MECANICO_ASIGNADO` (el que recibe el inspector) |

---

## 17. BASE DE DATOS COMPARTIDA

La app Flutter **no tiene su propia base de datos en el servidor**. Comparte la misma instancia PostgreSQL que la web.

### Qué significa en la práctica

- Un inspector creado desde el admin web aparece automáticamente en la app móvil
- Un informe iniciado en la app móvil es visible inmediatamente en el admin web
- Las fotos subidas desde la app van a la misma tabla `InspectionPhoto` y al mismo Cloudinary
- Las notificaciones creadas por la web (ej: `MECANICO_ASIGNADO`) se leen desde la app
- El admin puede ver en tiempo real el progreso del checklist que el inspector llena en la app

### Tablas que la app lee/escribe

| Tabla | Lee | Escribe | Vía endpoint |
|-------|-----|---------|--------------|
| `User` | Sí (login, perfil) | Sí (contraseña) | `/api/login`, `/api/user/*` |
| `Booking` | Sí (agenda, dashboard) | Sí (complete, no_show) | `/api/reports`, `/api/inspector/schedule` |
| `Vehicle` | Sí (datos del vehículo) | Sí (placa via register_plate) | `/api/vehicle-inspections/[id]/mechanic` |
| `VehicleInspection` | Sí (estado dual) | Sí (start, complete, placa) | `/api/vehicle-inspections/*` |
| `InspectionReport` | Sí (informe) | Sí (checklist, veredicto) | `/api/reports/*` |
| `InspectionPhoto` | Sí (fotos) | Sí (subir, eliminar) | `/api/reports/[id]/photos/*`, `/api/photos/*` |
| `Notification` | Sí (notificaciones) | Sí (marcar leída, eliminar) | `/api/notifications/*` |
| `InspectionPlan` | Sí (plan contratado) | No | Incluido en respuestas de booking |
| `Brand`, `Model` | Sí (catálogo) | No | Incluido en respuestas de vehicle |

### Autenticación — JWT para la app móvil

La web usa NextAuth con sessions en la tabla `Session` de la DB. Para la app móvil hay que crear un endpoint que:

1. Reciba `{ email, password }`
2. Valide contra la tabla `User` (bcrypt)
3. Verifique `role` = `INSPECTOR` o `ADMIN`
4. Verifique `status` = `ACTIVE`
5. Retorne un **JWT** firmado con los datos del usuario
6. El JWT se almacena en el dispositivo (flutter_secure_storage)
7. Se envía en el header `Authorization: Bearer {token}` en cada request

> El middleware de las API routes del backend necesita aceptar tanto la sesión NextAuth (web) como el JWT (app) para autenticar requests. Esto se puede hacer con un helper que intente ambos métodos.
