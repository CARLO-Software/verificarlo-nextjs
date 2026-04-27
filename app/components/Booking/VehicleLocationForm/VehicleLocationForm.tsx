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

import { useState, useEffect, useRef } from "react";
import styles from "./VehicleLocationForm.module.css";
import { District, searchDistrictsGrouped } from "@/prisma/data/districts";
import AddressAutocomplete, { PlaceDetails } from "@/app/components/Booking/AddressAutocomplete";

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
  const [brandQuery, setBrandQuery] = useState(vehicleData.brandName);
  const [modelQuery, setModelQuery] = useState(vehicleData.modelName);
  const [districtQuery, setDistrictQuery] = useState(locationData.districtName);
  const [addressInput, setAddressInput] = useState(locationData.address);

  // Estado para "Otro" año (entrada manual)
  const [isOtherYear, setIsOtherYear] = useState(false);
  const [manualYearInput, setManualYearInput] = useState("");

  // Lista de distritos agrupados por zona
  const districtGroups = searchDistrictsGrouped(districtQuery);

  // =============================================================================
  // EFECTO: Sincronizar estados locales cuando las props cambian (draft restore)
  // =============================================================================
  const prevBrandName = useRef(vehicleData.brandName);
  const prevModelName = useRef(vehicleData.modelName);
  const prevDistrictName = useRef(locationData.districtName);
  const prevAddress = useRef(locationData.address);

  useEffect(() => {
    // Solo sincronizar si el valor cambió de vacío a algo (draft restore)
    if (!prevBrandName.current && vehicleData.brandName) {
      setBrandQuery(vehicleData.brandName);
    }
    if (!prevModelName.current && vehicleData.modelName) {
      setModelQuery(vehicleData.modelName);
    }
    if (!prevDistrictName.current && locationData.districtName) {
      setDistrictQuery(locationData.districtName);
    }
    if (!prevAddress.current && locationData.address) {
      setAddressInput(locationData.address);
    }

    // Actualizar refs
    prevBrandName.current = vehicleData.brandName;
    prevModelName.current = vehicleData.modelName;
    prevDistrictName.current = locationData.districtName;
    prevAddress.current = locationData.address;
  }, [vehicleData.brandName, vehicleData.modelName, locationData.districtName, locationData.address]);

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
    setIsOtherYear(false);
    setManualYearInput("");
  };

  const handleDistrictSelect = (district: District) => {
    onLocationChange({
      ...locationData,
      districtId: district.id,
      districtName: district.name,
      address: "", // Limpiar dirección al cambiar distrito
    });
    setDistrictQuery(district.name);
    setAddressInput(""); // Limpiar input de dirección
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

  // Handler para cambio de año (select o "Otro")
  const handleYearChange = (value: string) => {
    if (value === "other") {
      setIsOtherYear(true);
      setManualYearInput("");
      onVehicleChange({
        ...vehicleData,
        year: null,
      });
    } else {
      setIsOtherYear(false);
      onVehicleChange({
        ...vehicleData,
        year: Number(value),
      });
    }
  };

  // Handler para input manual de año
  const handleManualYearInput = (value: string) => {
    if (/^\d*$/.test(value)) {
      setManualYearInput(value);
      const yearNum = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      if (value.length === 4 && yearNum >= 1900 && yearNum <= currentYear + 1) {
        onVehicleChange({
          ...vehicleData,
          year: yearNum,
        });
      } else {
        onVehicleChange({
          ...vehicleData,
          year: null,
        });
      }
    }
  };

  // Filtrar listas según búsqueda
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandQuery.toLowerCase())
  );

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(modelQuery.toLowerCase())
  );

  // Handler para cuando el usuario selecciona una dirección de Google Places
  const handlePlaceSelect = (place: PlaceDetails) => {
    // Actualizar tanto el estado local como el padre
    setAddressInput(place.formatted_address);
    onLocationChange({
      ...locationData,
      address: place.formatted_address,
    });
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
            {isOtherYear ? (
              <>
                <input
                  type="text"
                  value={manualYearInput}
                  onChange={(e) => handleManualYearInput(e.target.value)}
                  placeholder="Escribe el año (ej. 2018)"
                  maxLength={4}
                  className={styles.input}
                  aria-required="true"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsOtherYear(false);
                    setManualYearInput("");
                    onVehicleChange({ ...vehicleData, year: null });
                  }}
                  className={styles.linkButton}
                >
                  ← Volver a la lista
                </button>
              </>
            ) : (
              <select
                value={vehicleData.year || ""}
                onChange={(e) => handleYearChange(e.target.value)}
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
                <option value="other">Otro (escribir manualmente)</option>
              </select>
            )}
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
                placeholder="Selecciona o busca un distrito..."
                className={styles.input}
                aria-required="true"
              />
              {showDistricts && districtGroups.length > 0 && (
                <div className={`${styles.dropdown} ${styles.dropdownDistricts}`}>
                  {districtGroups.map((group) => (
                    <div key={group.zone} className={styles.districtGroup}>
                      <div className={styles.districtGroupHeader}>
                        {group.zoneName}
                      </div>
                      {group.districts.map((district) => (
                        <div
                          key={district.id}
                          onClick={() => handleDistrictSelect(district)}
                          className={styles.dropdownItem}
                        >
                          <span>{district.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DIRECCIÓN EXACTA - Google Places Autocomplete */}
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.label}>
              Dirección exacta <span className={styles.required}>*</span>
            </label>
            <AddressAutocomplete
              value={addressInput}
              onChange={(value) => {
                setAddressInput(value);
                onLocationChange({
                  ...locationData,
                  address: value,
                });
              }}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Busca tu dirección..."
              disabled={!locationData.districtId}
              required
            />
            <span className={styles.helperText}>
              Escribe para buscar direcciones en Lima
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
