import { PrismaClient } from "@prisma/client";
import { vehicles } from "./data/vehicles";
import { inspections } from "./data/inspections"

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de vehículos...");

  // 1. Extraer marcas únicas
  const uniqueBrands = Array.from(new Set(vehicles.map((v) => v.brand)));
  console.log(`Encontradas ${uniqueBrands.length} marcas únicas`);

  // 2. Crear marcas
  for (const brandName of uniqueBrands) {
    await prisma.brand.upsert({
      where: { id: uniqueBrands.indexOf(brandName) + 1 },
      update: {logo: `/assets/icons/${brandName.toLowerCase()}.svg`},
      create: {
        name: brandName,
        logo: `/assets/icons/${brandName.toLowerCase()}.svg`,
      },
    });
  }
  console.log("Marcas creadas");

  // 3. Obtener marcas de la DB para tener sus IDs
  const brandsInDb = await prisma.brand.findMany();
  const brandMap = new Map(brandsInDb.map((b) => [b.name, b.id]));

  // 4. Agrupar vehículos por marca+modelo para calcular year_from y year_to
  const modelGroups = new Map<string, { brand: string; model: string; years: number[] }>();

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

  console.log(`Encontrados ${modelGroups.size} modelos únicos`);

  // 5. Crear modelos
  let createdCount = 0;
  for (const [_, data] of Array.from(modelGroups)) {
    const brandId = brandMap.get(data.brand);
    if (!brandId) {
      console.warn(`Marca no encontrada: ${data.brand}`);
      continue;
    }

    const yearFrom = Math.min(...data.years);
    const yearTo = Math.max(...data.years);

    // Verificar si el modelo ya existe
    const existingModel = await prisma.model.findFirst({
      where: {
        brand_id: brandId,
        name: data.model,
      },
    });

    if (!existingModel) {
      await prisma.model.create({
        data: {
          brand_id: brandId,
          name: data.model,
          year_from: yearFrom,
          year_to: yearTo,
        },
      });
      createdCount++;
    }
  }

  console.log(`${createdCount} modelos creados`);

  // ... código anterior de marcas y modelos ...

  console.log(`${createdCount} modelos creados`);

  // 🆕 NUEVA SECCIÓN INSPECTIONS
  console.log("Creando inspecciones...");
  let inspectionCreatedCount = 0;

  for (const inspection of inspections) {

    const existing = await prisma.inspection.findFirst({
      where: { type: inspection.type }
    });
    
    if (!existing) {
      await prisma.inspection.create({
        data: {
          type: inspection.type,
          title: inspection.title,
          description: inspection.description,
          price: inspection.price
        }
      });
      inspectionCreatedCount++;
    }
  }

  console.log(`${inspectionCreatedCount} inspecciones creadas/verificadas`);
  console.log("Seed completado!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
