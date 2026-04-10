-- Migración: Eliminar estado CONFIRMED del enum BookingStatus
-- Los registros CONFIRMED se migran a PAID

-- 1. Limpiar tipo temporal si existe de intento anterior
DROP TYPE IF EXISTS "BookingStatus_new";

-- 2. Actualizar registros existentes de CONFIRMED a PAID
UPDATE "Booking" SET "status" = 'PAID' WHERE "status" = 'CONFIRMED';

-- 3. Crear nuevo enum sin CONFIRMED
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'PAID', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED');

-- 4. Quitar el default antes de cambiar el tipo
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;

-- 5. Cambiar la columna al nuevo enum
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");

-- 6. Restaurar el default
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'::"BookingStatus_new";

-- 7. Eliminar enum antiguo
DROP TYPE "BookingStatus";

-- 8. Renombrar nuevo enum al nombre original
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
