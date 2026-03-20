"use client";

// ============================================================================
// HOOK — usePaymentStatus
// Hace polling al endpoint /api/bookings/[id]/status y para automáticamente
// cuando se alcanza un estado terminal (CONFIRMED, FAILED, EXPIRED, etc.)
// ============================================================================

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus =
  | "PENDING_PAYMENT"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "EXPIRED";

type PaymentStatus =
  | "PENDING"
  | "PENDING_VERIFICATION"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export interface PaymentStatusData {
  bookingId: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  isTerminal: boolean;
  amount: number | null;
  paymentMethod: string | null;
  chargeId: string | null;
  errorMessage: string | null;
  paidAt: string | null;
  date: string;
  timeSlot: string;
  expiresAt: string | null;
  inspector: { name: string; phone: string | null } | null;
  plan: { title: string; type: string } | null;
}

export interface UsePaymentStatusOptions {
  /** Milliseconds between polls. Default: 3000ms */
  intervalMs?: number;
  /** Max number of polling attempts before giving up. Default: 40 (~2 min) */
  maxAttempts?: number;
  /** Called when status reaches a terminal state */
  onTerminal?: (data: PaymentStatusData) => void;
}

export interface UsePaymentStatusReturn {
  data: PaymentStatusData | null;
  /** True only during the initial fetch */
  isLoading: boolean;
  /** True while polling is active */
  isPolling: boolean;
  error: string | null;
  /** Manually trigger a single fetch (e.g. on a "retry" button) */
  refetch: () => void;
  stopPolling: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TERMINAL_BOOKING: BookingStatus[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "NO_SHOW",
];

const TERMINAL_PAYMENT: PaymentStatus[] = ["COMPLETED", "FAILED", "REFUNDED"];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePaymentStatus(
  bookingId: number | null,
  options: UsePaymentStatusOptions = {}
): UsePaymentStatusReturn {
  const { intervalMs = 3000, maxAttempts = 40, onTerminal } = options;

  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const onTerminalRef = useRef(onTerminal);
  onTerminalRef.current = onTerminal; // keep latest callback without re-triggering effect

  // ── Internal: stop polling ──────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
  }, []);

  // ── Internal: single fetch ──────────────────────────────────────────────────
  const fetchStatus = useCallback(async (): Promise<PaymentStatusData> => {
    if (!bookingId) throw new Error("No bookingId");

    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      // Prevent browser from serving stale cache during polling
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? `HTTP ${res.status}`);
    }

    return res.json();
  }, [bookingId]);

  // ── Internal: check if status is terminal and act ───────────────────────────
  const handleNewData = useCallback(
    (newData: PaymentStatusData) => {
      setData(newData);
      setError(null);

      const paymentTerminal = TERMINAL_PAYMENT.includes(newData.paymentStatus);
      const bookingTerminal = TERMINAL_BOOKING.includes(newData.bookingStatus);

      if (paymentTerminal || bookingTerminal || newData.isTerminal) {
        stopPolling();
        onTerminalRef.current?.(newData);
      }
    },
    [stopPolling]
  );

  // ── Public: manual refetch ──────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const newData = await fetchStatus();
      handleNewData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al verificar");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, fetchStatus, handleNewData]);

  // ── Main effect: initial fetch + start polling ──────────────────────────────
  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    const startPollingLoop = () => {
      if (intervalRef.current) return; // already running
      setIsPolling(true);
      attemptsRef.current = 0;

      intervalRef.current = setInterval(async () => {
        if (cancelled) return stopPolling();
        attemptsRef.current++;

        try {
          const newData = await fetchStatus();
          if (!cancelled) handleNewData(newData);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Error de conexión");
          }
        }

        if (attemptsRef.current >= maxAttempts) {
          stopPolling();
        }
      }, intervalMs);
    };

    // Initial fetch immediately
    setIsLoading(true);
    fetchStatus()
      .then((newData) => {
        if (cancelled) return;
        handleNewData(newData);
        // Only start polling if status is NOT yet terminal
        const isT =
          TERMINAL_PAYMENT.includes(newData.paymentStatus) ||
          TERMINAL_BOOKING.includes(newData.bookingStatus) ||
          newData.isTerminal;
        if (!isT) startPollingLoop();
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar");
          startPollingLoop(); // still poll on initial error (network blip)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  return { data, isLoading, isPolling, error, refetch, stopPolling };
}
