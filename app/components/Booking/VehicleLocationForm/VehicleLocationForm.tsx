// =============================================================================
// COMPONENTE: VehicleLocationForm (Datos del Vehículo + Ubicación - Paso 2)
// =============================================================================
// Este formulario recopila:
// - Datos del vehículo: Marca, Modelo, Año, Placa (opcional), Kilometraje (opcional)
// - Datos de ubicación: Distrito, Dirección exacta
//
// CONCEPTO: "Controlled Components" (Componentes Controlados)
// En React, los inputs del formulario son "controlados" cuando su valor
// viene del estado de React (value={estado}) y se actualiza con onChange.
//
// Esto nos permite:
// - Validar mientras el usuario escribe
// - Formatear automáticamente (ej: placa ABC-123)
// - Sincronizar múltiples campos (ej: modelo depende de marca)
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import styles from "./VehicleLocationForm.module.css";
import { getDistrictsSorted, District } from "@/prisma/data/districts";
import { searchStreets, Street } from "@/prisma/data/streets";

// =============================================================================
// HELPERS: Funciones auxiliares para formateo
// =============================================================================

// Formatear placa: ABC123 -> ABC-123
function formatPlate(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length > 3) {
    return clean.slice(0, 3) + "-" + clean.slice(3, 6);
  }
  return clean;
}

// =============================================================================
// TIPOS
// =============================================================================

interface Brand {
  id: number;
  name: string;
  logo: string;
}

interface Model {
  id: number;
  name: string;
  brandId: number;
  yearFrom: number;
  yearTo: number;
}

interface VehicleData {
  brandId: number | null;
  brandName: string;
  modelId: number | null;
  modelName: string;
  year: number | null;
  plate: string;
}

interface LocationData {
  districtId: number | null;
  districtName: string;
  address: string;
}

interface VehicleLocationFormProps {
  brands: Brand[];
  vehicleData: VehicleData;
  locationData: LocationData;
  onVehicleChange: (data: VehicleData) => void;
  onLocationChange: (data: LocationData) => void;
}

export default function VehicleLocationForm({
  brands,
  vehicleData,
  locationData,
  onVehicleChange,
  onLocationChange,
}: VehicleLocationFormProps) {
  // Estados locales para UI de dropdowns
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showStreets, setShowStreets] = useState(false);
  const [brandQuery, setBrandQuery] = useState(vehicleData.brandName);
  const [modelQuery, setModelQuery] = useState(vehicleData.modelName);
  const [districtQuery, setDistrictQuery] = useState(locationData.districtName);
  const [addressQuery, setAddressQuery] = useState(locationData.address);

  // Lista de distritos (ordenados alfabéticamente)
  const districts = getDistrictsSorted();

  // =============================================================================
  // EFECTO: Cargar modelos cuando cambia la marca
  // =============================================================================
  // useEffect se ejecuta después de que el componente se renderiza.
  // El array [vehicleData.brandId] es la "lista de dependencias":
  // el efecto solo se ejecuta cuando brandId cambia.

  useEffect(() => {
    if (vehicleData.brandId) {
      loadModels(vehicleData.brandId);
    } else {
      setModels([]);
    }
  }, [vehicleData.brandId]);

  // Función para cargar modelos desde la API
  const loadModels = async (brandId: number) => {
    setLoadingModels(true);
    try {
      const res = await fetch(`/api/vehicles/models/${brandId}`);
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.error("Error cargando modelos:", err);
    } finally {
      setLoadingModels(false);
    }
  };

  // =============================================================================
  // HANDLERS: Funciones para manejar cambios
  // =============================================================================

  const handleBrandSelect = (brand: Brand) => {
    onVehicleChange({
      ...vehicleData,
      brandId: brand.id,
      brandName: brand.name,
      modelId: null,
      modelName: "",
      year: null, // Reset año al cambiar marca
    });
    setBrandQuery(brand.name);
    setModelQuery("");
    setShowBrands(false);
  };

  const handleModelSelect = (model: Model) => {
    onVehicleChange({
      ...vehicleData,
      modelId: model.id,
      modelName: model.name,
      year: null, // Reset año al cambiar modelo
    });
    setModelQuery(model.name);
    setShowModels(false);
  };

  const handleDistrictSelect = (district: District) => {
    onLocationChange({
      ...locationData,
      districtId: district.id,
      districtName: district.name,
      address: "", // Limpiar dirección al cambiar distrito
    });
    setDistrictQuery(district.name);
    setAddressQuery(""); // Limpiar query de dirección
    setShowDistricts(false);
  };

  // Generar años disponibles basados en el modelo seleccionado
  const getAvailableYears = () => {
    const selectedModel = models.find((m) => m.id === vehicleData.modelId);
    if (!selectedModel) return [];

    const years = [];
    for (let y = selectedModel.yearTo; y >= selectedModel.yearFrom; y--) {
      years.push(y);
    }
    return years;
  };

  // Filtrar listas según búsqueda
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandQuery.toLowerCase())
  );

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelQuery.toLowerCase())
  );

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(districtQuery.toLowerCase())
  );

  // Filtrar calles según distrito seleccionado y búsqueda
  const filteredStreets = locationData.districtId
    ? searchStreets(locationData.districtId, addressQuery)
    : [];

  // Handler para seleccionar una calle del autocompletado
  const handleStreetSelect = (street: Street) => {
    // Agregar la calle seleccionada como inicio de la dirección
    const newAddress = street.name + " ";
    setAddressQuery(newAddress);
    onLocationChange({
      ...locationData,
      address: newAddress,
    });
    setShowStreets(false);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>¿Qué auto revisamos y dónde?</h2>
      <p className={styles.subtitle}>
        Ingresa los datos del vehículo y la dirección donde realizaremos la
        inspección
      </p>

      {/* =================================================================
          SECCIÓN: DATOS DEL VEHÍCULO
          ================================================================= */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Datos del vehículo</h3>

        <div className={styles.formGrid}>
          {/* MARCA */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Marca <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
              <input
                type="text"
                value={brandQuery}
                onChange={(e) => {
                  setBrandQuery(e.target.value);
                  setShowBrands(true);
                }}
                onFocus={() => setShowBrands(true)}
                onBlur={() => setTimeout(() => setShowBrands(false), 200)}
                placeholder="Buscar marca..."
                className={styles.input}
                aria-required="true"
              />
              {showBrands && filteredBrands.length > 0 && (
                <div className={styles.dropdown}>
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand)}
                      className={styles.dropdownItem}
                    >
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className={styles.brandLogo}
                      />
                      <span>{brand.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MODELO */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Modelo <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
              <input
                type="text"
                value={modelQuery}
                onChange={(e) => {
                  setModelQuery(e.target.value);
                  setShowModels(true);
                }}
                onFocus={() => setShowModels(true)}
                onBlur={() => setTimeout(() => setShowModels(false), 200)}
                placeholder={loadingModels ? "Cargando..." : "Buscar modelo..."}
                disabled={!vehicleData.brandId || loadingModels}
                className={styles.input}
                aria-required="true"
              />
              {showModels && filteredModels.length > 0 && (
                <div className={styles.dropdown}>
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                      className={styles.dropdownItem}
                    >
                      <span>{model.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AÑO */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Año <span className={styles.required}>*</span>
            </label>
            <select
              value={vehicleData.year || ""}
              onChange={(e) =>
                onVehicleChange({
                  ...vehicleData,
                  year: Number(e.target.value),
                })
              }
              disabled={!vehicleData.modelId}
              className={styles.select}
              aria-required="true"
            >
              <option value="">Seleccionar año</option>
              {getAvailableYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* PLACA (opcional) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Placa (opcional)</label>
            <input
              type="text"
              value={vehicleData.plate}
              onChange={(e) =>
                onVehicleChange({
                  ...vehicleData,
                  plate: formatPlate(e.target.value),
                })
              }
              placeholder="ABC-123"
              maxLength={7}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* =================================================================
          SECCIÓN: UBICACIÓN DE LA VISITA
          ================================================================= */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Ubicación de la visita</h3>

        <div className={styles.formGrid}>
          {/* DISTRITO */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Distrito <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
              <input
                type="text"
                value={districtQuery}
                onChange={(e) => {
                  setDistrictQuery(e.target.value);
                  setShowDistricts(true);
                }}
                onFocus={() => setShowDistricts(true)}
                onBlur={() => setTimeout(() => setShowDistricts(false), 200)}
                placeholder="Buscar distrito..."
                className={styles.input}
                aria-required="true"
              />
              {showDistricts && filteredDistricts.length > 0 && (
                <div className={styles.dropdown}>
                  {filteredDistricts.slice(0, 10).map((district) => (
                    <div
                      key={district.id}
                      onClick={() => handleDistrictSelect(district)}
                      className={styles.dropdownItem}
                    >
                      <span>{district.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DIRECCIÓN EXACTA */}
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.label}>
              Dirección exacta <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value);
                  onLocationChange({
                    ...locationData,
                    address: e.target.value,
                  });
                  // Mostrar sugerencias solo si hay distrito seleccionado
                  if (locationData.districtId) {
                    setShowStreets(true);
                  }
                }}
                onFocus={() => {
                  if (locationData.districtId && addressQuery.length < 20) {
                    setShowStreets(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowStreets(false), 200)}
                placeholder={
                  locationData.districtId
                    ? "Escribe para ver sugerencias de calles..."
                    : "Primero selecciona un distrito"
                }
                disabled={!locationData.districtId}
                className={styles.input}
                aria-required="true"
              />
              {showStreets && filteredStreets.length > 0 && addressQuery.length < 20 && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    Avenidas y calles en {locationData.districtName}
                  </div>
                  {filteredStreets.slice(0, 8).map((street, index) => (
                    <div
                      key={index}
                      onClick={() => handleStreetSelect(street)}
                      className={styles.dropdownItem}
                    >
                      <span className={styles.streetIcon}>
                        {street.type === "avenida" && "🛣️"}
                        {street.type === "calle" && "🚶"}
                        {street.type === "jiron" && "📍"}
                        {street.type === "malecon" && "🌊"}
                        {street.type === "alameda" && "🌳"}
                        {street.type === "pasaje" && "🚪"}
                      </span>
                      <span>{street.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className={styles.helperText}>
              Selecciona una avenida y agrega el número y referencias
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
