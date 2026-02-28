"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
});

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/equipo", label: "Equipo" },
  { href: "/servicios", label: "Servicios" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative md:absolute top-0 w-full z-40">
      {/* Barra fina superior */}
      <div className="h-1 bg-neutral-800" />

      <header className="flex items-center justify-between px-4 sm:px-6 md:px-16 py-4 md:py-6 bg-white">
        <Link
          href="/"
          className={`text-2xl md:text-[1.8vw] font-script text-accent ${greatVibes.className}`}
          onClick={() => setMenuOpen(false)}
        >
          TrenzasGM
        </Link>

        {/* Desktop: enlaces visibles */}
        <nav className="hidden md:flex items-center gap-8 text-[1vw]">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={href === "/" ? "text-accent font-medium" : "text-neutral-500 font-medium hover:text-accent transition-colors"}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile: botón hamburguesa */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-accent transition-colors touch-manipulation"
          aria-expanded={menuOpen}
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Overlay: cerrar al tocar fuera (solo móvil) */}
      <button
        type="button"
        className={`md:hidden fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Cerrar menú"
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile: panel deslizante desde la derecha, h-full */}
      <div
        className={`md:hidden fixed top-0 right-0 z-50 h-full w-[min(100vw-7rem,20rem)] bg-white shadow-xl transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end p-4 border-b border-neutral-200">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-accent transition-colors touch-manipulation"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col flex-1 py-4 overflow-y-auto">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-6 py-3 text-neutral-700 font-medium hover:bg-neutral-50 hover:text-accent transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}