"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type SpeechStatus = "idle" | "listening" | "processing" | "error" | "unsupported";

/**
 * Post-procesa el texto para convertir palabras de puntuación en símbolos.
 * Ej: "Coma se encontró algo" → ", se encontró algo"
 */
function cleanPunctuation(text: string): string {
  return text
    // Puntuación básica
    .replace(/\bcoma\b/gi, ',')
    .replace(/\bpunto y coma\b/gi, ';')
    .replace(/\bdos puntos\b/gi, ':')
    .replace(/\bpunto\b/gi, '.')
    // Signos de interrogación/exclamación
    .replace(/\b(signo de |abre |abrir )interrogación\b/gi, '¿')
    .replace(/\b(cierra |cerrar )interrogación\b/gi, '?')
    .replace(/\binterrogación\b/gi, '?')
    .replace(/\b(signo de |abre |abrir )exclamación\b/gi, '¡')
    .replace(/\b(cierra |cerrar )exclamación\b/gi, '!')
    .replace(/\bexclamación\b/gi, '!')
    // Paréntesis
    .replace(/\b(abre |abrir )paréntesis\b/gi, '(')
    .replace(/\b(cierra |cerrar )paréntesis\b/gi, ')')
    // Comillas
    .replace(/\b(abre |abrir )comillas\b/gi, '"')
    .replace(/\b(cierra |cerrar )comillas\b/gi, '"')
    .replace(/\bcomillas\b/gi, '"')
    // Guiones
    .replace(/\bguión\b/gi, '-')
    .replace(/\bguión bajo\b/gi, '_')
    // Nueva línea
    .replace(/\b(nueva línea|salto de línea|enter)\b/gi, '\n')
    // Limpiar espacios extra alrededor de puntuación
    .replace(/\s+([,.:;?!)\]])/g, '$1')  // Quitar espacio ANTES de puntuación de cierre
    .replace(/([¿¡(\[])\s+/g, '$1')       // Quitar espacio DESPUÉS de puntuación de apertura
    .replace(/\s+/g, ' ')                 // Múltiples espacios → uno solo
    .trim();
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  status: SpeechStatus;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "es-PE", onResult, onError } = options;

  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  // Refs para callbacks (evitar recrear recognition)
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const recognitionRef = useRef<any>(null);

  // Actualizar refs cuando cambian los callbacks
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  // Inicializar recognition UNA sola vez
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    console.log("[Speech] Init, API:", !!SpeechRecognitionAPI);

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setStatus("unsupported");
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      console.log("[Speech] onstart");
      setStatus("listening");
    };

    recognition.onresult = (event: any) => {
      console.log("[Speech] onresult", event.results);

      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
        setStatus("processing");
      }

      if (finalTranscript) {
        const cleanedTranscript = cleanPunctuation(finalTranscript);
        console.log("[Speech] Final:", finalTranscript, "→", cleanedTranscript);
        setTranscript(cleanedTranscript);
        setStatus("idle");
        onResultRef.current?.(cleanedTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[Speech] onerror:", event.error);

      if (event.error === "aborted" || event.error === "no-speech") {
        setStatus("idle");
        return;
      }

      setStatus("error");

      let msg = "Error de reconocimiento";
      if (event.error === "not-allowed") msg = "Permiso denegado";
      if (event.error === "network") msg = "Error de red";
      if (event.error === "audio-capture") msg = "No hay micrófono";

      onErrorRef.current?.(msg);
    };

    recognition.onend = () => {
      console.log("[Speech] onend");
      setStatus("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [lang]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    console.log("[Speech] startListening, recognition:", !!recognition, "status:", status);

    if (!recognition) return;

    // Si ya está escuchando, no hacer nada
    if (status === "listening" || status === "processing") {
      console.log("[Speech] Already listening, ignoring");
      return;
    }

    setTranscript("");

    try {
      recognition.start();
      console.log("[Speech] start() OK");
    } catch (e: any) {
      // Si ya está iniciado, detenerlo y volver a intentar
      if (e.name === "InvalidStateError") {
        console.log("[Speech] Already started, stopping first...");
        recognition.stop();
      } else {
        console.error("[Speech] start() error:", e);
      }
    }
  }, [status]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch (e) {
      // ignore
    }
    setStatus("idle");
  }, []);

  return {
    status,
    transcript,
    isSupported,
    startListening,
    stopListening,
  };
}
