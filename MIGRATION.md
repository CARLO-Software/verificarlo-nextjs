# Migración del Sistema de Agendamiento

## Resumen de Cambios

Se ha implementado un sistema completo de agendamiento semiautomático con:

- **Nuevo modelo `Booking`** (reemplaza `Schedule`)
- **Modelo `Vehicle`** (vehículos separados para reutilización)
- **Modelo `Payment`** (integración con Culqi)
- **Modelo `BlockedDate`** (fechas bloqueadas por admin)
- **Sistema de asignación automática de inspectores**
- **Endpoints completos de API**

---

## Pasos de Migración

### 1. Instalar dependencias nuevas

```bash
npm install date-fns date-fns-tz
npm install @types/bcryptjs --save-dev
```

### 2. Mover el schema.prisma a la ubicación estándar (opcional)

```bash
# Si quieres mover el schema a prisma/
mv schema.prisma prisma/schema.prisma
```

Si lo mueves, actualiza `package.json`:
```json
{
  "prisma": {
    "schema": "prisma/schema.prisma",
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 3. Generar la migración de Prisma

```bash
# Crear migración (NO ejecutar push directamente si tienes datos)
npx prisma migrate dev --name add_booking_system --create-only

# Revisar el SQL generado en prisma/migrations/
# Luego aplicar:
npx prisma migrate dev
```

**IMPORTANTE**: Si tienes datos en `Schedule`, la migración no los eliminará porque el modelo `Schedule` se mantiene temporalmente.

### 4. Migrar datos existentes (si aplica)

Si tienes datos en la tabla `Schedule`:

```bash
# Ejecutar script de migración
npx tsx prisma/migrations/migrate-schedule-to-booking.ts
```

### 5. Verificar y eliminar modelo legacy

Después de verificar que los datos migraron correctamente:

1. Abre `schema.prisma`
2. Elimina el modelo `Schedule` y sus relaciones en `User`, `Model`, e `Inspection`
3. Ejecuta: `npx prisma migrate dev --name remove_schedule_model`

### 6. Configurar variables de entorno

Agrega estas variables en `.env`:

```env
# Culqi
CULQI_PUBLIC_KEY=pk_test_xxxxx
CULQI_SECRET_KEY=sk_test_xxxxx

# Cron (para Vercel)
CRON_SECRET=tu_secreto_seguro_aqui
```

### 7. Crear inspectores

Ejecuta en la consola de Prisma o crea un seed:

```typescript
// Para promover usuarios a inspectores
await prisma.user.update({
  where: { email: "inspector1@verificarlo.pe" },
  data: { role: "INSPECTOR", isActive: true }
});
```

### 8. Crear fechas bloqueadas iniciales (opcional)

```typescript
// Bloquear feriados adicionales
await prisma.blockedDate.createMany({
  data: [
    { date: new Date("2025-07-28"), reason: "Fiestas Patrias", createdBy: 1 },
    { date: new Date("2025-12-25"), reason: "Navidad", createdBy: 1 },
  ]
});
```

---

## Estructura de Archivos Creados

```
lib/
├── scheduling/
│   ├── index.ts           # Exports
│   ├── constants.ts       # Constantes (horarios, feriados)
│   ├── availability.ts    # Algoritmo de disponibilidad
│   └── inspector-assignment.ts  # Asignación de inspectores
├── cron/
│   └── cleanup-expired.ts # Limpieza de reservas expiradas
└── notifications/         # (Por implementar)

app/api/
├── availability/route.ts  # GET disponibilidad
├── bookings/
│   ├── route.ts           # POST crear, GET listar
│   └── [id]/
│       ├── route.ts       # GET detalle
│       ├── reschedule/route.ts
│       └── cancel/route.ts
├── payments/
│   └── culqi/route.ts     # Procesar pago
├── inspector/
│   └── schedule/route.ts  # Agenda del inspector
├── admin/
│   ├── block-date/route.ts
│   └── inspectors/route.ts
└── cron/
    └── cleanup/route.ts   # Endpoint para Vercel Cron

types/
├── next-auth.d.ts         # Tipos extendidos NextAuth
└── booking.ts             # Tipos del sistema de booking

vercel.json                # Configuración de Cron
MIGRATION.md               # Este archivo
```

---

## Endpoints API Disponibles

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/availability?date=YYYY-MM-DD` | Slots de un día | No |
| GET | `/api/availability?month=YYYY-MM` | Disponibilidad mensual | No |
| POST | `/api/bookings` | Crear reserva | Cliente |
| GET | `/api/bookings` | Listar reservas propias | Cliente |
| GET | `/api/bookings/[id]` | Detalle de reserva | Cliente/Inspector/Admin |
| POST | `/api/bookings/[id]/reschedule` | Reprogramar (1 vez) | Cliente |
| POST | `/api/bookings/[id]/cancel` | Cancelar (+24h) | Cliente |
| POST | `/api/payments/culqi` | Procesar pago | Cliente |
| GET | `/api/inspector/schedule` | Agenda del inspector | Inspector |
| PATCH | `/api/inspector/schedule` | Marcar completado/no-show | Inspector |
| GET | `/api/admin/block-date` | Listar fechas bloqueadas | Admin |
| POST | `/api/admin/block-date` | Bloquear fecha | Admin |
| DELETE | `/api/admin/block-date` | Desbloquear fecha | Admin |
| GET | `/api/admin/inspectors` | Listar inspectores | Admin |
| POST | `/api/admin/inspectors` | Promover a inspector | Admin |
| PATCH | `/api/admin/inspectors` | Activar/desactivar/reasignar | Admin |
| DELETE | `/api/admin/inspectors` | Degradar a cliente | Admin |

---

## Próximos Pasos (Por Implementar)

1. **Componentes de UI** para el flujo de reserva
2. **Sistema de notificaciones** (WhatsApp + Email)
3. **Panel del cliente** (mis citas)
4. **Panel del inspector** (agenda)
5. **Panel de administrador** (gestión completa)
6. **Tests automatizados**

---

## Notas Importantes

- El slot se bloquea por 30 minutos mientras el cliente paga
- Los inspectores se asignan automáticamente (balanceo de carga)
- Solo se permite 1 reprogramación por cita
- Cancelaciones/reprogramaciones requieren 24h de anticipación
- No hay reembolsos (según reglas del negocio)
- El cron de limpieza corre cada 5 minutos en Vercel
