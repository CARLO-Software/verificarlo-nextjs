import { PrismaClient } from "@prisma/client";
import { vehicles } from "./data/vehicles";
import { inspectionPlans, inspectionPlanItems } from "./data/inspections";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando seed...\n");

  await prisma.$transaction(async (tx) => {
    // ============================================
    // 1. CREAR MARCAS (Brands)
    // ============================================
    console.log("📦 Procesando marcas...");

    const uniqueBrands = [...new Set(vehicles.map((v) => v.brand))];

    // Upsert de marcas - usa name como identificador único
    for (const brandName of uniqueBrands) {
      await tx.brand.upsert({
        where: { name: brandName },
        update: { logo: `/assets/icons/${brandName.toLowerCase()}.svg` },
        create: {
          name: brandName,
          logo: `/assets/icons/${brandName.toLowerCase()}.svg`,
        },
      });
    }

    console.log(`   ✓ ${uniqueBrands.length} marcas procesadas`);

    // ============================================
    // 2. CREAR MODELOS (Models)
    // ============================================
    console.log("📦 Procesando modelos...");

    // Obtener marcas con sus IDs
    const brandsInDb = await tx.brand.findMany();
    const brandMap = new Map(brandsInDb.map((b) => [b.name, b.id]));

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

    // Preparar datos para upsert de modelos
    let modelCount = 0;
    for (const [_, data] of modelGroups) {
      const brandId = brandMap.get(data.brand);
      if (!brandId) {
        console.warn(`   ⚠ Marca no encontrada: ${data.brand}`);
        continue;
      }

      const yearFrom = Math.min(...data.years);
      const yearTo = Math.max(...data.years);

      // Upsert usando la constraint única [brandId, name]
      await tx.model.upsert({
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

      modelCount++;
    }

    console.log(`   ✓ ${modelCount} modelos procesados`);

    // ============================================
    // 3. CREAR PLANES DE INSPECCIÓN (InspectionPlans)
    // ============================================
    console.log("📦 Procesando planes de inspección...");

    for (const plan of inspectionPlans) {
      await tx.inspectionPlan.upsert({
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
      });
    }

    console.log(`   ✓ ${inspectionPlans.length} planes de inspección procesados`);

    // ============================================
    // 4. CREAR ITEMS DE PLANES DE INSPECCIÓN (InspectionPlanItems)
    // ============================================
    console.log("📦 Procesando items de planes de inspección...");

    // Obtener planes de inspección de la DB
    const plansInDb = await tx.inspectionPlan.findMany();
    const planMap = new Map(plansInDb.map((p) => [p.type, p.id]));

    // Mapeo: inspectionPlanId del array -> tipo de plan
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

    // Obtener items existentes para evitar duplicados
    const existingItems = await tx.inspectionPlanItem.findMany({
      select: { inspectionPlanId: true, label: true },
    });

    const existingSet = new Set(
      existingItems.map((item) => `${item.inspectionPlanId}-${item.label}`)
    );

    // Filtrar solo los nuevos
    const newItems = itemsToCreate.filter(
      (item) => !existingSet.has(`${item.inspectionPlanId}-${item.label}`)
    );

    // Crear en batch
    if (newItems.length > 0) {
      await tx.inspectionPlanItem.createMany({
        data: newItems,
        skipDuplicates: true,
      });
    }

    console.log(
      `   ✓ ${newItems.length} items de planes de inspección creados (${existingItems.length} ya existían)`
    );

    // ============================================
    // 5. CREAR INSPECTOR DE PRUEBA
    // ============================================
    console.log("📦 Procesando inspector de prueba...");

    const testInspector = await tx.user.upsert({
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

    console.log(`   ✓ Inspector de prueba creado (ID: ${testInspector.id})`);
  });

  console.log("\n✅ Seed completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
