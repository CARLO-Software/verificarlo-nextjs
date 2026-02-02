import { PrismaClient } from "@prisma/client";
import { vehicles } from "./data/vehicles";
import { inspections, inspectionsItems } from "./data/inspections";

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

      // Upsert usando la constraint única [brand_id, name]
      await tx.model.upsert({
        where: {
          brand_id_name: {
            brand_id: brandId,
            name: data.model,
          },
        },
        update: {
          year_from: yearFrom,
          year_to: yearTo,
        },
        create: {
          brand_id: brandId,
          name: data.model,
          year_from: yearFrom,
          year_to: yearTo,
        },
      });

      modelCount++;
    }

    console.log(`   ✓ ${modelCount} modelos procesados`);

    // ============================================
    // 3. CREAR INSPECCIONES (Inspections)
    // ============================================
    console.log("📦 Procesando inspecciones...");

    for (const inspection of inspections) {
      await tx.inspection.upsert({
        where: { id: inspection.id },
        update: {
          type: inspection.type,
          title: inspection.title,
          description: inspection.description,
          price: inspection.price,
        },
        create: {
          type: inspection.type,
          title: inspection.title,
          description: inspection.description,
          price: inspection.price,
        },
      });
    }

    console.log(`   ✓ ${inspections.length} inspecciones procesadas`);

    // ============================================
    // 4. CREAR ITEMS DE INSPECCIÓN (InspectionItems)
    // ============================================
    console.log("📦 Procesando items de inspección...");

    // Obtener inspecciones de la DB
    const inspectionsInDb = await tx.inspection.findMany();
    const inspectionMap = new Map(inspectionsInDb.map((i) => [i.type, i.id]));

    // Mapeo: inspection_id del array -> tipo de inspección
    const inspectionTypes = ["legal", "basica", "completa"] as const;

    // Recopilar todos los items a crear
    const itemsToCreate: { inspection_id: number; label: string }[] = [];

    for (const ii of inspectionsItems) {
      const inspectionType = inspectionTypes[ii.inspection_id - 1];
      const realInspectionId = inspectionMap.get(inspectionType);

      if (!realInspectionId) {
        console.warn(
          `   ⚠ Inspección no encontrada para tipo: ${inspectionType}`
        );
        continue;
      }

      for (const label of ii.label) {
        itemsToCreate.push({
          inspection_id: realInspectionId,
          label: label,
        });
      }
    }

    // Obtener items existentes para evitar duplicados
    const existingItems = await tx.inspectionItem.findMany({
      select: { inspection_id: true, label: true },
    });

    const existingSet = new Set(
      existingItems.map((item) => `${item.inspection_id}-${item.label}`)
    );

    // Filtrar solo los nuevos
    const newItems = itemsToCreate.filter(
      (item) => !existingSet.has(`${item.inspection_id}-${item.label}`)
    );

    // Crear en batch
    if (newItems.length > 0) {
      await tx.inspectionItem.createMany({
        data: newItems,
        skipDuplicates: true,
      });
    }

    console.log(
      `   ✓ ${newItems.length} items de inspección creados (${existingItems.length} ya existían)`
    );
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
