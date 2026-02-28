"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
});


export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(
          err.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos."
            : err.message,
        );
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 py-10">
        <h1 className={`text-3xl font-script text-center text-neutral-800 mb-1 ${greatVibes.className}`}>
          TrenzasGM
        </h1>
        <p className="text-neutral-500 text-sm mb-6 text-center">
          Inicia sesión para gestionar citas y disponibilidad.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-base text-neutral-700 border outline-none border-neutral-200 placeholder:text-neutral-400"
              placeholder="admin@ejemplo.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={`${showPassword ? "text" : "password"}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-base text-neutral-700 border outline-none border-neutral-200 placeholder:text-neutral-400"
              />
              {
                showPassword ? (
                  <button type="button" onClick={() => setShowPassword(false)} className="absolute right-0 top-0 bottom-0 min-w-[44px] flex items-center justify-center touch-manipulation" aria-label="Ocultar contraseña">
                    <EyeIcon className="w-4 h-4 text-neutral-500" />
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowPassword(true)} className="absolute right-0 top-0 bottom-0 min-w-[44px] flex items-center justify-center touch-manipulation" aria-label="Mostrar contraseña">
                    <EyeOffIcon className="w-4 h-4 text-neutral-500" />
                  </button>
                )
              }
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 min-h-[44px] rounded-xl text-xs md:text-sm bg-neutral-800 text-white font-medium hover:bg-neutral-700 disabled:opacity-50 touch-manipulation"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center justify-center py-3 min-h-[44px] text-xs text-neutral-500 hover:text-neutral-700 touch-manipulation">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </div>
  );
}
