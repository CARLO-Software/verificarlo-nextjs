// ============================================
// SCRIPT DE MIGRACIÓN: Schedule → Booking
// Ejecutar UNA vez después de aplicar la migración de Prisma
// ============================================

import { PrismaClient } from "@prisma/client";
import { addMinutes, startOfDay, format } from "date-fns";

const prisma = new PrismaClient();

async function migrateSchedulesToBookings() {
  console.log("🚀 Iniciando migración de Schedule a Booking...\n");

  // 1. Obtener todos los schedules existentes
  const schedules = await prisma.schedule.findMany({
    include: {
      user: true,
      model: true,
      inspection: true,
    },
  });

  console.log(`📋 Se encontraron ${schedules.length} schedule(s) para migrar.\n`);

  if (schedules.length === 0) {
    console.log("✅ No hay datos para migrar.");
    return;
  }

  let migrated = 0;
  let errors = 0;

  for (const schedule of schedules) {
    try {
      // 2. Crear o encontrar Vehicle para el usuario
      let vehicle = await prisma.vehicle.findFirst({
        where: {
          userId: schedule.user_id,
          plate: schedule.plate,
        },
      });

      if (!vehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            userId: schedule.user_id,
            modelId: schedule.model_id,
            year: schedule.year,
            plate: schedule.plate,
            mileage: schedule.mileage,
          },
        });
        console.log(`  🚗 Vehículo creado: ${schedule.plate}`);
      }

      // 3. Extraer fecha y hora del schedule
      const startTime = schedule.date_time;
      const date = startOfDay(startTime);
      const timeSlot = format(startTime, "HH:mm");
      const endTime = addMinutes(startTime, 45);

      // 4. Crear Booking
      const booking = await prisma.booking.create({
        data: {
          clientId: schedule.user_id,
          inspectionId: schedule.inspection_id,
          vehicleId: vehicle.id,
          date,
          timeSlot,
          startTime,
          endTime,
          status: "COMPLETED", // Asumir que schedules antiguos están completados
          createdAt: schedule.created_at,
          updatedAt: schedule.updated_at,
          completedAt: schedule.date_time, // Asumir completado en la fecha programada
        },
      });

      // 5. Crear Payment (simulado como completado)
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: schedule.inspection.price * 100,
          status: "COMPLETED",
          paidAt: schedule.created_at,
        },
      });

      console.log(
        `  ✅ Schedule #${schedule.id} → Booking #${booking.id} (${schedule.plate})`
      );
      migrated++;
    } catch (error: any) {
      console.error(
        `  ❌ Error migrando Schedule #${schedule.id}: ${error.message}`
      );
      errors++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Resumen de migración:`);
  console.log(`   - Migrados: ${migrated}`);
  console.log(`   - Errores: ${errors}`);
  console.log("=".repeat(50));

  if (errors === 0) {
    console.log(
      "\n✅ Migración completada exitosamente."
    );
    console.log(
      "   Puedes eliminar el modelo Schedule del schema.prisma después de verificar los datos."
    );
  } else {
    console.log(
      "\n⚠️  Migración completada con errores. Revisa los registros antes de continuar."
    );
  }
}

// Ejecutar migración
migrateSchedulesToBookings()
  .catch((e) => {
    console.error("Error fatal en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
