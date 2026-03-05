import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { vehicles } from "./data/vehicles";
import { inspectionPlans, inspectionPlanItems } from "./data/inspections";

const prisma = new PrismaClient();

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Procesa las marcas de vehículos usando upsert en batch
 */
async function seedBrands(): Promise<Map<string, number>> {
  console.log("📦 Procesando marcas...");

  const uniqueBrands = [...new Set(vehicles.map((v) => v.brand))];

  // Upsert de cada marca individualmente
  await Promise.all(
    uniqueBrands.map((brandName) =>
      prisma.brand.upsert({
        where: { name: brandName },
        update: { logo: `/assets/icons/${brandName.toLowerCase()}.svg` },
        create: {
          name: brandName,
          logo: `/assets/icons/${brandName.toLowerCase()}.svg`,
        },
      })
    )
  );

  // Obtener el mapa de marcas con sus IDs
  const brandsInDb = await prisma.brand.findMany();
  const brandMap = new Map(brandsInDb.map((b) => [b.name, b.id]));

  console.log(`   ✓ ${uniqueBrands.length} marcas procesadas`);
  return brandMap;
}

/**
 * Procesa los modelos de vehículos usando upsert en batch
 */
async function seedModels(brandMap: Map<string, number>): Promise<void> {
  console.log("📦 Procesando modelos...");

  // Agrupar vehículos por marca+modelo para calcular rangos de años
  const modelGroups = new Map<
    string,
    { brand: string; model: string; years: number[] }
  >();

  for (const vehicle of vehicles) {
    const key = `${vehicle.brand}-${vehicle.model}`;
    if (!modelGroups.has(key)) {
      modelGroups.set(key, {
        brand: vehicle.brand,
        model: vehicle.model,
        years: [],
      });
    }
    modelGroups.get(key)!.years.push(vehicle.year);
  }

  // Upsert de modelos secuencialmente para evitar conflictos de concurrencia
  const modelEntries = Array.from(modelGroups.values());
  let processedCount = 0;

  for (const data of modelEntries) {
    const brandId = brandMap.get(data.brand);
    if (!brandId) {
      console.warn(`   ⚠ Marca no encontrada: ${data.brand}`);
      continue;
    }

    const yearFrom = Math.min(...data.years);
    const yearTo = Math.max(...data.years);

    try {
      await prisma.model.upsert({
        where: {
          brandId_name: {
            brandId: brandId,
            name: data.model,
          },
        },
        update: {
          yearFrom: yearFrom,
          yearTo: yearTo,
        },
        create: {
          brandId: brandId,
          name: data.model,
          yearFrom: yearFrom,
          yearTo: yearTo,
        },
      });
      processedCount++;
    } catch (error) {
      // Si ya existe, intentar actualizar
      console.warn(`   ⚠ Error procesando modelo ${data.model}, intentando actualizar...`);
      try {
        await prisma.model.updateMany({
          where: {
            brandId: brandId,
            name: data.model,
          },
          data: {
            yearFrom: yearFrom,
            yearTo: yearTo,
          },
        });
        processedCount++;
      } catch {
        console.warn(`   ⚠ No se pudo procesar: ${data.brand} ${data.model}`);
      }
    }
  }

  console.log(`   ✓ ${processedCount} modelos procesados`);
}

/**
 * Procesa los planes de inspección usando upsert
 */
async function seedInspectionPlans(): Promise<Map<string, number>> {
  console.log("📦 Procesando planes de inspección...");

  await Promise.all(
    inspectionPlans.map((plan) =>
      prisma.inspectionPlan.upsert({
        where: { id: plan.id },
        update: {
          type: plan.type,
          title: plan.title,
          description: plan.description,
          price: plan.price,
        },
        create: {
          type: plan.type,
          title: plan.title,
          description: plan.description,
          price: plan.price,
        },
      })
    )
  );

  // Obtener el mapa de planes con sus IDs
  const plansInDb = await prisma.inspectionPlan.findMany();
  const planMap = new Map(plansInDb.map((p) => [p.type, p.id]));

  console.log(`   ✓ ${inspectionPlans.length} planes de inspección procesados`);
  return planMap;
}

/**
 * Procesa los items de planes de inspección usando createMany con skipDuplicates
 */
async function seedInspectionPlanItems(
  planMap: Map<string, number>
): Promise<void> {
  console.log("📦 Procesando items de planes de inspección...");

  const planTypes = ["legal", "basica", "completa"] as const;

  // Recopilar todos los items a crear
  const itemsToCreate: { inspectionPlanId: number; label: string }[] = [];

  for (const ii of inspectionPlanItems) {
    const planType = planTypes[ii.inspectionPlanId - 1];
    const realPlanId = planMap.get(planType);

    if (!realPlanId) {
      console.warn(
        `   ⚠ Plan de inspección no encontrado para tipo: ${planType}`
      );
      continue;
    }

    for (const label of ii.label) {
      itemsToCreate.push({
        inspectionPlanId: realPlanId,
        label: label,
      });
    }
  }

  // Obtener items existentes para contar
  const existingCount = await prisma.inspectionPlanItem.count();

  // Crear en batch usando skipDuplicates (requiere índice único en [inspectionPlanId, label])
  // Si no hay índice único, filtramos manualmente
  const existingItems = await prisma.inspectionPlanItem.findMany({
    select: { inspectionPlanId: true, label: true },
  });

  const existingSet = new Set(
    existingItems.map((item) => `${item.inspectionPlanId}-${item.label}`)
  );

  const newItems = itemsToCreate.filter(
    (item) => !existingSet.has(`${item.inspectionPlanId}-${item.label}`)
  );

  if (newItems.length > 0) {
    // Insertar en batches para evitar límites de query
    const BATCH_SIZE = 100;
    for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
      const batch = newItems.slice(i, i + BATCH_SIZE);
      await prisma.inspectionPlanItem.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }

  console.log(
    `   ✓ ${newItems.length} items creados (${existingCount} ya existían)`
  );
}

/**
 * Crea o actualiza el inspector de prueba
 */
async function seedTestInspector(): Promise<void> {
  console.log("📦 Procesando inspector de prueba...");

  const testInspector = await prisma.user.upsert({
    where: { email: "inspector@verificarlo.pe" },
    update: {
      role: "INSPECTOR",
      isInspectorAvailable: true,
    },
    create: {
      name: "Inspector de Prueba",
      email: "inspector@verificarlo.pe",
      role: "INSPECTOR",
      isInspectorAvailable: true,
    },
  });

  console.log(`   ✓ Inspector de prueba procesado (ID: ${testInspector.id})`);
}

/**
 * Crea usuarios de prueba (admin y cliente)
 */
async function seedTestUsers(): Promise<void> {
  console.log("📦 Procesando usuarios de prueba...");

  // Contraseña por defecto para usuarios de prueba
  const defaultPassword = "hola1212";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "jesus@gmail.com" },
    update: {
      name: "Jesus Choe",
      role: "ADMIN",
      password: hashedPassword,
    },
    create: {
      name: "Jesus Choe",
      email: "jesus@gmail.com",
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  // Cliente
  await prisma.user.upsert({
    where: { email: "esteban@gmail.com" },
    update: {
      name: "Esteban Cliente",
      role: "CLIENT",
      password: hashedPassword,
    },
    create: {
      name: "Esteban Cliente",
      email: "esteban@gmail.com",
      role: "CLIENT",
      password: hashedPassword,
    },
  });

  console.log(`   ✓ 2 usuarios de prueba procesados (Admin y Cliente)`);
  console.log(`   ℹ Contraseña por defecto: ${defaultPassword}`);
}

/**
 * Crea las categorías del blog
 */
async function seedBlogCategories(): Promise<void> {
  console.log("📦 Procesando categorías del blog...");

  const categories = [
    { name: "Consejos", slug: "consejos", color: "#FFD700" },
    { name: "Alertas", slug: "alertas", color: "#EF4444" },
    { name: "Guías", slug: "guias", color: "#3B82F6" },
    { name: "Noticias", slug: "noticias", color: "#22C55E" },
  ];

  for (const category of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        color: category.color,
      },
      create: category,
    });
  }

  console.log(`   ✓ ${categories.length} categorías de blog procesadas`);
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
  console.log("🚀 Iniciando seed...\n");

  // Ejecutar cada sección secuencialmente para mantener dependencias
  // pero sin una transacción global que pueda expirar

  // 1. Marcas (independiente)
  const brandMap = await seedBrands();

  // 2. Modelos (depende de marcas)
  await seedModels(brandMap);

  // 3. Planes de inspección (independiente)
  const planMap = await seedInspectionPlans();

  // 4. Items de planes (depende de planes)
  await seedInspectionPlanItems(planMap);

  // 5. Inspector de prueba (independiente)
  await seedTestInspector();

  // 6. Usuarios de prueba (admin y cliente)
  await seedTestUsers();

  // 7. Categorías del blog (independiente)
  await seedBlogCategories();

  console.log("\n✅ Seed completado!");
}

// ============================================
// EJECUCIÓN
// ============================================

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
