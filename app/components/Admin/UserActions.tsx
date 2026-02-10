"use client";

import { useEffect, useRef, useState } from "react";
import { useEscape } from "@/hooks/useEscape";

interface Props {
  userId: string;
  role: "ADMIN" | "INSPECTOR" | "CLIENT";
  status: "ACTIVE" | "SUSPENDED";
  isSelf?: boolean;
  onEditRole: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export function UserActions({
  userId,
  role,
  status,
  isSelf = false,
  onEditRole,
  onSuspend,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEscape(() => {
    if (open) setOpen(false);
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detectar si el dropdown queda cortado abajo
  useEffect(() => {
    if (open && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const overflowsBottom = rect.bottom > window.innerHeight;
      setDropUp(overflowsBottom);
    }
  }, [open]);

  // No mostrar el botón ⋮ para administradores
  if (role === "ADMIN") return null;

  const handleToggle = () => setOpen((v) => !v);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        aria-label="Acciones de usuario"
        aria-expanded={open}
      >
        <span className="text-xl leading-none">⋮</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`absolute right-0 z-20 w-48 rounded-md border bg-white shadow-lg ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          role="menu"
        >
          <ul className="py-1 text-sm">
            {/* Cambiar rol */}
            <li role="menuitem">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                onClick={() => {
                  onEditRole(userId);
                  setOpen(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Cambiar rol
              </button>
            </li>

            {/* Suspender / Reactivar */}
            <li role="menuitem">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-amber-600"
                onClick={() => {
                  onSuspend(userId);
                  setOpen(false);
                }}
              >
                {status === "ACTIVE" ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="9" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 2l10 6-10 6V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                )}
                {status === "ACTIVE" ? "Suspender" : "Reactivar"}
              </button>
            </li>

            {/* Eliminar */}
            {!isSelf && (
              <li role="menuitem">
                <hr className="my-1 border-gray-200" />
                <button
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={() => {
                    onDelete(userId);
                    setOpen(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a2 2 0 002 2h4a2 2 0 002-2l1-9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Eliminar
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
