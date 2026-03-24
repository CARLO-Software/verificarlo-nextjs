"use client";

import { useSpeechRecognition } from "@/app/hooks/useSpeechRecognition";
import styles from "./VoiceButton.module.css";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({ onTranscript, disabled = false, className = "" }: VoiceButtonProps) {
  const {
    status,
    transcript,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang: "es-PE",
    onResult: (text) => {
      onTranscript(text);
    },
  });

  // No renderizar si no está soportado
  if (!isSupported) {
    return null;
  }

  const isListening = status === "listening" || status === "processing";

  const handleClick = () => {
    if (disabled) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case "listening":
        return "Escuchando...";
      case "processing":
        return transcript || "Procesando...";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`${styles.button} ${isListening ? styles.buttonListening : ""}`}
        title={isListening ? "Detener" : "Dictar comentario"}
        aria-label={isListening ? "Detener grabación" : "Iniciar grabación de voz"}
      >
        {isListening ? (
          // Icono de stop
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor" />
          </svg>
        ) : (
          // Icono de micrófono
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1a2 2 0 0 0-2 2v5a2 2 0 1 0 4 0V3a2 2 0 0 0-2-2z"
              fill="currentColor"
            />
            <path
              d="M4 7a1 1 0 0 0-2 0 6 6 0 0 0 5 5.91V14H5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9v-1.09A6 6 0 0 0 14 7a1 1 0 1 0-2 0 4 4 0 0 1-8 0z"
              fill="currentColor"
            />
          </svg>
        )}
        {/* Animación de pulso cuando está escuchando */}
        {isListening && (
          <>
            <span className={styles.pulse} />
            <span className={styles.pulse2} />
          </>
        )}
      </button>

      {/* Tooltip con el texto mientras habla */}
      {isListening && transcript && (
        <div className={styles.transcript}>
          {transcript}
        </div>
      )}
    </div>
  );
}
