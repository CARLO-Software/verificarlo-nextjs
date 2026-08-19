/**
 * useGooglePlacesAutocomplete.ts
 *
 * Hook optimizado para Google Places Autocomplete que minimiza costos:
 *
 * OPTIMIZACIONES DE COSTO:
 * 1. Debounce (300ms) - Evita requests mientras el usuario escribe rápido
 * 2. SessionToken - Agrupa todas las requests de una sesión de búsqueda
 *    (Autocomplete + Place Details = $0.017 en vez de $0.00283/request + $0.017)
 * 3. Mínimo 3 caracteres - No busca con inputs muy cortos
 * 4. Place Details solo al seleccionar - No al mostrar sugerencias
 * 5. Location bias - Prioriza resultados en Perú (menos resultados irrelevantes)
 * 6. Cache de sesión - Evita requests duplicadas
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Tipos
export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

interface UseGooglePlacesAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  // Bias hacia Lima, Perú
  locationBias?: {
    lat: number;
    lng: number;
    radius: number; // en metros
  };
}

const DEFAULT_OPTIONS: UseGooglePlacesAutocompleteOptions = {
  debounceMs: 300,
  minChars: 3,
  locationBias: {
    lat: -12.0464, // Lima
    lng: -77.0428,
    radius: 50000, // 50km
  },
};

// Estado global para el script de Google Maps
let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: (() => void)[] = [];

export function useGooglePlacesAutocomplete(
  options: UseGooglePlacesAutocompleteOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Refs para mantener instancias entre renders
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>("");

  // Cargar Google Maps API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log("[GooglePlaces] Iniciando hook...");
    console.log("[GooglePlaces] API Key presente:", !!apiKey);

    if (!apiKey) {
      console.error("[GooglePlaces] ERROR: API key no configurada");
      setError("Google Maps API key no configurada");
      return;
    }

    // Si ya está cargado, inicializar servicios
    if (googleMapsLoaded && window.google?.maps?.places) {
      console.log("[GooglePlaces] Ya cargado, inicializando servicios...");
      initializeServices();
      return;
    }

    // Si está cargando, agregar callback
    if (googleMapsLoading) {
      console.log("[GooglePlaces] Ya está cargando, agregando callback...");
      loadCallbacks.push(() => initializeServices());
      return;
    }

    // Cargar script
    console.log("[GooglePlaces] Cargando script de Google Maps...");
    googleMapsLoading = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Callback global que Google llama cuando carga
    (window as unknown as { __googleMapsCallback: () => void }).__googleMapsCallback = () => {
      console.log("[GooglePlaces] Script cargado! Callback ejecutado.");
      googleMapsLoaded = true;
      googleMapsLoading = false;
      initializeServices();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = (e) => {
      console.error("[GooglePlaces] ERROR cargando script:", e);
      console.error("[GooglePlaces] URL del script:", script.src);
      console.error("[GooglePlaces] Revisa la consola Network para ver el status HTTP de maps.googleapis.com");
      setError("Error cargando Google Maps. Revisa la consola del navegador (F12 → Network) para más detalles.");
      googleMapsLoading = false;
    };

    document.head.appendChild(script);
    console.log("[GooglePlaces] Script agregado al DOM");

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicializar servicios de Google Places
  const initializeServices = useCallback(() => {
    console.log("[GooglePlaces] initializeServices llamado");
    console.log("[GooglePlaces] window.google:", !!window.google);
    console.log("[GooglePlaces] window.google.maps:", !!window.google?.maps);
    console.log("[GooglePlaces] window.google.maps.places:", !!window.google?.maps?.places);

    if (!window.google?.maps?.places) {
      console.error("[GooglePlaces] ERROR: google.maps.places no disponible");
      return;
    }

    try {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      console.log("[GooglePlaces] AutocompleteService creado");

      // PlacesService necesita un elemento DOM (puede ser hidden)
      const dummyElement = document.createElement("div");
      placesServiceRef.current = new google.maps.places.PlacesService(dummyElement);
      console.log("[GooglePlaces] PlacesService creado");

      // Crear session token inicial
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      console.log("[GooglePlaces] SessionToken creado");

      setIsReady(true);
      console.log("[GooglePlaces] isReady = true");
    } catch (err) {
      console.error("[GooglePlaces] ERROR inicializando servicios:", err);
    }
  }, []);

  // Generar nuevo session token (después de seleccionar un lugar)
  const refreshSessionToken = useCallback(() => {
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  // Buscar predicciones con debounce
  const searchPlaces = useCallback(
    (input: string) => {
      console.log("[GooglePlaces] searchPlaces llamado con:", input);

      // Limpiar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Validaciones
      if (!input || input.length < (opts.minChars || 3)) {
        console.log("[GooglePlaces] Input muy corto, limpiando predicciones");
        setPredictions([]);
        return;
      }

      // Evitar búsquedas duplicadas
      if (input === lastQueryRef.current) {
        console.log("[GooglePlaces] Query duplicada, ignorando");
        return;
      }

      setIsLoading(true);
      console.log("[GooglePlaces] Iniciando debounce...");

      // Debounce
      debounceTimerRef.current = setTimeout(() => {
        console.log("[GooglePlaces] Debounce terminado, haciendo request...");
        console.log("[GooglePlaces] autocompleteService:", !!autocompleteServiceRef.current);
        console.log("[GooglePlaces] sessionToken:", !!sessionTokenRef.current);

        if (!autocompleteServiceRef.current || !sessionTokenRef.current) {
          console.error("[GooglePlaces] ERROR: Servicios no inicializados");
          setIsLoading(false);
          return;
        }

        lastQueryRef.current = input;

        const request: google.maps.places.AutocompletionRequest = {
          input,
          sessionToken: sessionTokenRef.current,
          types: ["address"], // Solo direcciones
          componentRestrictions: { country: "pe" }, // Solo Perú
        };

        // Agregar location bias si está configurado (usar CircleLiteral, no Circle)
        if (opts.locationBias) {
          request.locationBias = {
            center: { lat: opts.locationBias.lat, lng: opts.locationBias.lng },
            radius: opts.locationBias.radius,
          };
        }

        console.log("[GooglePlaces] Request:", JSON.stringify(request, null, 2));

        try {
          autocompleteServiceRef.current.getPlacePredictions(
            request,
            (results, status) => {
              console.log("[GooglePlaces] Response status:", status);
              console.log("[GooglePlaces] Results count:", results?.length || 0);
              setIsLoading(false);

              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                setPredictions(
                  results.map((r) => ({
                    place_id: r.place_id,
                    description: r.description,
                    structured_formatting: {
                      main_text: r.structured_formatting.main_text,
                      secondary_text: r.structured_formatting.secondary_text,
                    },
                  }))
                );
              } else {
                // ZERO_RESULTS es normal, otros status son warnings
                if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                  console.warn("Places Autocomplete status:", status);
                }
                setPredictions([]);
              }
            }
          );
          console.log("[GooglePlaces] getPlacePredictions llamado OK");
        } catch (err) {
          console.error("[GooglePlaces] ERROR en getPlacePredictions:", err);
          setIsLoading(false);
        }
      }, opts.debounceMs);
    },
    [opts.debounceMs, opts.minChars, opts.locationBias]
  );

  // Obtener detalles de un lugar (solo cuando el usuario selecciona)
  const getPlaceDetails = useCallback(
    (placeId: string): Promise<PlaceDetails | null> => {
      return new Promise((resolve) => {
        if (!placesServiceRef.current || !sessionTokenRef.current) {
          resolve(null);
          return;
        }

        const request: google.maps.places.PlaceDetailsRequest = {
          placeId,
          sessionToken: sessionTokenRef.current,
          // Solo pedir campos necesarios (reduce costo)
          fields: [
            "place_id",
            "formatted_address",
            "name",
            "geometry",
            "address_components",
          ],
        };

        placesServiceRef.current.getDetails(request, (place, status) => {
          // Refrescar token después de obtener detalles
          // (termina la "sesión" de búsqueda)
          refreshSessionToken();

          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              place_id: place.place_id || "",
              formatted_address: place.formatted_address || "",
              name: place.name || "",
              geometry: {
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0,
                },
              },
              address_components: (place.address_components || []).map((ac) => ({
                long_name: ac.long_name,
                short_name: ac.short_name,
                types: ac.types,
              })),
            });
          } else {
            console.warn("Place Details status:", status);
            resolve(null);
          }
        });
      });
    },
    [refreshSessionToken]
  );

  // Limpiar predicciones
  const clearPredictions = useCallback(() => {
    setPredictions([]);
    lastQueryRef.current = "";
  }, []);

  return {
    predictions,
    isLoading,
    isReady,
    error,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
    refreshSessionToken,
  };
}
