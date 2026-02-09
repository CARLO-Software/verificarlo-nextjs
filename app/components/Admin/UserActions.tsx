"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  userId: string;
  role: "ADMIN" | "INSPECTOR" | "CLIENT";
  status: "ACTIVE" | "SUSPENDED";
  isSelf?: boolean;
}

export function UserActions({ userId, role, status, isSelf = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const isAdmin = role === "ADMIN";

  return (
    <div className="relative" ref={ref}>
      {/* Botón ⋮ */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        aria-label="Acciones de usuario"
      >
        <span className="text-xl leading-none">⋮</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border bg-white shadow-lg">
          <ul className="py-1 text-sm">
            {/* Cambiar rol */}
            {!isAdmin && (
              <li>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50">
                  Cambiar rol
                </button>
              </li>
            )}

            {/* Suspender / Activar */}
            <li>
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50">
                {status === "ACTIVE" ? "Suspender" : "Reactivar"}
              </button>
            </li>

            {/* Eliminar */}
            {!isAdmin && !isSelf && (
              <li>
                <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50">
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
