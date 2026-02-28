import Link from "next/link";
import React from "react";
import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
    variable: "--font-great-vibes",
    subsets: ["latin"],
    weight: ["400"],
});
const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-8xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <Link href="/" className={`text-2xl ${greatVibes.className} text-accent shrink-0`}>
            TrenzasGM
          </Link>

          <nav className="flex flex-wrap md:text-base text-sm flex-col md:flex-row md:items-center items-start md:justify-center gap-4 md:gap-6">
            <Link href="/" className="text-white/90 hover:text-accent transition-colors">
              Inicio
            </Link>
            <Link href="/servicios" className="text-white/90 hover:text-accent transition-colors">
              Servicios
            </Link>
            <Link href="/trabajos" className="text-white/90 hover:text-accent transition-colors">
              Trabajos
            </Link>
            <Link href="/contacto" className="text-white/90 hover:text-accent transition-colors">
              Contacto
            </Link>
            <a
              href="https://instagram.com/trenzas_g.m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-accent transition-colors"
            >
              Instagram
            </a>
          </nav>

          <div className="flex flex-col items-start md:items-end gap-2 mt-4 md:mt-0 shrink-0">
            {/* <a
              href="mailto:hola@trenzasgm.com"
              className="text-white/90 md:text-base text-sm hover:text-accent transition-colors"
            >
              hola@trenzasgm.com
            </a> */}
            <div className="flex gap-4 mt-2">
              <a
                href="https://instagram.com/trenzas_g.m"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-10 md:h-10 w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <svg className="md:w-5 md:h-5 w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20 text-center text-sm text-white/70">
          © {new Date().getFullYear()} TrenzasGM. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
