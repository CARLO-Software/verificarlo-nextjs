/**
 * AddressAutocomplete.tsx
 *
 * Componente de autocompletado de direcciones usando Google Places API.
 * Optimizado para minimizar costos de API.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import {
  useGooglePlacesAutocomplete,
  PlacePrediction,
  PlaceDetails,
} from "@/app/hooks/useGooglePlacesAutocomplete";
import styles from "./AddressAutocomplete.module.css";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Escribe una dirección...",
  disabled = false,
  required = false,
  className,
}: AddressAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    predictions,
    isLoading,
    isReady,
    error,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
  } = useGooglePlacesAutocomplete();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar cuando cambia el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);

    if (newValue.length >= 3) {
      searchPlaces(newValue);
      setShowDropdown(true);
    } else {
      clearPredictions();
      setShowDropdown(false);
    }
  };

  // Seleccionar una predicción
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowDropdown(false);
    onChange(prediction.description);

    // Obtener detalles completos (coordenadas, etc.)
    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      onPlaceSelect(details);
    }

    clearPredictions();
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handleSelectPrediction(predictions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Mostrar error si no hay API key
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${styles.input} ${className || ""}`}
        />
        <span className={styles.errorText}>{error}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={!isReady ? "Cargando..." : placeholder}
          disabled={disabled || !isReady}
          required={required}
          className={`${styles.input} ${className || ""}`}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />

        {/* Indicador de carga */}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner} />
          </div>
        )}

        {/* Icono de ubicación */}
        {!isLoading && (
          <div className={styles.locationIcon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && predictions.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {predictions.map((prediction, index) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`${styles.dropdownItem} ${
                index === selectedIndex ? styles.dropdownItemSelected : ""
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className={styles.predictionIcon}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.predictionText}>
                <span className={styles.mainText}>
                  {prediction.structured_formatting.main_text}
                </span>
                <span className={styles.secondaryText}>
                  {prediction.structured_formatting.secondary_text}
                </span>
              </div>
            </li>
          ))}

          {/* Atribución de Google (requerida por TOS) */}
          <li className={styles.attribution}>
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png"
              alt="Powered by Google"
              height="14"
            />
          </li>
        </ul>
      )}
    </div>
  );
}
