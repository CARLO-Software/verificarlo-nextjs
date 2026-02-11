/**
 * AgendarCTA: Call-to-Action elegante para agendar inspección.
 * Diseño moderno con ilustración y animaciones sutiles.
 */
'use client';

import Link from 'next/link';
import { ArrowRight, Car, Sparkles } from 'lucide-react';

export function AgendarCTA() {
  return (
    <Link
      href="/agendar"
      className="
        group relative block mb-8
        bg-white rounded-2xl
        border border-gray-100
        overflow-hidden
        transition-all duration-300
        hover:shadow-xl hover:shadow-amber-100/50
        hover:border-[#F5D849]/50
      "
    >
      {/* Fondo decorativo con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5D849]/5 via-transparent to-amber-100/20" />

      {/* Círculos decorativos animados */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#F5D849]/10 rounded-full transition-transform duration-500 group-hover:scale-150" />
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-100/30 rounded-full transition-transform duration-700 group-hover:scale-125" />

      <div className="relative p-5 sm:p-6 flex items-center gap-4 sm:gap-6">
        {/* Icono con animación */}
        <div className="relative flex-shrink-0">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-[#F5D849] rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />

          <div className="
            relative w-16 h-16 sm:w-20 sm:h-20
            bg-gradient-to-br from-[#F5D849] to-amber-400
            rounded-2xl
            flex items-center justify-center
            shadow-lg shadow-amber-200/50
            transition-all duration-500
            group-hover:scale-105 group-hover:rotate-3
          ">
            <Car size={32} className="text-gray-900 sm:w-10 sm:h-10" strokeWidth={1.5} />
          </div>

          {/* Badge animado */}
          <div className="
            absolute -top-1 -right-1
            w-6 h-6 rounded-full
            bg-green-500
            flex items-center justify-center
            ring-2 ring-white
            transition-transform duration-300
            group-hover:scale-110
          ">
            <Sparkles size={12} className="text-white" />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="
              inline-flex items-center gap-1
              text-[10px] sm:text-xs font-bold
              text-amber-700 bg-amber-100
              px-2 py-0.5 rounded-full
              uppercase tracking-wider
            ">
              <Sparkles size={10} />
              Nueva inspección
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">
            ¿Comprando un auto usado?
          </h3>

          <p className="text-sm text-gray-500 hidden sm:block">
            Agenda una inspección profesional y compra con tranquilidad
          </p>
          <p className="text-sm text-gray-500 sm:hidden">
            Inspección profesional en minutos
          </p>
        </div>

        {/* Botón flecha */}
        <div className="
          flex-shrink-0
          w-10 h-10 sm:w-12 sm:h-12
          rounded-full
          bg-gray-900
          flex items-center justify-center
          transition-all duration-300
          group-hover:bg-[#F5D849]
          group-hover:scale-110
        ">
          <ArrowRight
            size={20}
            className="
              text-white
              transition-all duration-300
              group-hover:text-gray-900
              group-hover:translate-x-0.5
            "
          />
        </div>
      </div>

      {/* Barra inferior de progreso animada */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div className="
          h-full w-1/3
          bg-gradient-to-r from-[#F5D849] to-amber-400
          -translate-x-full
          group-hover:translate-x-[400%]
          transition-transform duration-1000 ease-out
        " />
      </div>
    </Link>
  );
}
