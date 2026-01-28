import { PrismaClient } from "@prisma/client";
import { vehicles } from "./data/vehicles";
import { inspections, inspectionsItems } from "./data/inspections"

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de vehículos...");

  // 1. Extraer marcas únicas
  const uniqueBrands = Array.from(new Set(vehicles.map((v) => v.brand)));
  console.log(`Encontradas ${uniqueBrands.length} marcas únicas`);

  // 2. Crear marcas
  for (const brandName of uniqueBrands) {
    //El upsert, actualiza si existe, y sino lo va a crear

    await prisma.brand.upsert({
      //Condición para buscar la marca existente
      //Se busca por el id, que se transoforma en base a la posicion en el array
      //upsert va a actualizar si se encuentra usando en el where, y no se encuentra registrado en la base de datos
      where: { id: uniqueBrands.indexOf(brandName) + 1 },
      update: { logo: `/assets/icons/${brandName.toLowerCase()}.svg` },
      create: {
        name: brandName,
        logo: `/assets/icons/${brandName.toLowerCase()}.svg`,
      },
    });
  }

  console.log("Marcas creadas");

  // TODO HACER UNA CONEXIÓN CON InspectionItem para la llave foránea
  // 3. Obtener marcas de la DB para tener sus IDs
  const brandsInDb = await prisma.brand.findMany();

  //b.name = key, b.id = valor ->>>> "Map{"Toyota" => 1}
  const brandMap = new Map(brandsInDb.map((b) => [b.name, b.id]));

  // 4. Agrupar vehículos por marca+modelo para calcular year_from y year_to
  const modelGroups = new Map<string, { brand: string; model: string; years: number[] }>();

  for (const vehicle of vehicles) {

    //Se creó la key unica en base a la marca - modelo
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
    //Devuelve el valor asociado con esa key
    const brandId = brandMap.get(data.brand); //brandMap.get("Toyota") -> 1

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

  // 🆕 NUEVA SECCIÓN InspectionItem
  console.log("Creando items de inspecciones...");
  let createItemInspeccionCount = 0;

  // Obtener las inspecciones de la DB para mapear type -> id
  const inspectionsInDb = await prisma.inspection.findMany();
  const inspectionMap = new Map(inspectionsInDb.map((i) => [i.type, i.id]));

  for (const ii of inspectionsItems) {
    // Obtener el ID real de la inspección basado en el inspection_id del array
    // inspection_id: 1 = legal, 2 = basica, 3 = completa
    const inspectionTypes = ["legal", "basica", "completa"] as const;
    const inspectionType = inspectionTypes[ii.inspection_id - 1];
    const realInspectionId = inspectionMap.get(inspectionType);

    if (!realInspectionId) {
      console.warn(`Inspección no encontrada para tipo: ${inspectionType}`);
      continue;
    }
    
    // Iterar sobre cada label del array y crear un InspectionItem
    for (const label of ii.label) {
      const existing = await prisma.inspectionItem.findFirst({
        where: {
          inspection_id: realInspectionId,
          label: label,
        },
      });

      if (!existing) {
        await prisma.inspectionItem.create({
          data: {
            inspection_id: realInspectionId,
            label: label,
          },
        });
        createItemInspeccionCount++;
      }
    }
  }

  console.log(`${createItemInspeccionCount} items de inspección creados`);
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
