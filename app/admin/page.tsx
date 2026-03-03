"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { endOfDay, endOfWeek, format, startOfDay, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CalendarDays, ChevronDown, ChevronUp, Copy } from "lucide-react";

type Appointment = {
  id: string;
  email: string;
  client_name: string | null;
  date: string;
  time_slot: string;
  created_at: string;
  status?: string;
  phone_number: string
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    monthTotal: 0,
    todayTotal: 0,
    weekTotal: 0,
  });
  const [latestAppointments, setLatestAppointments] = useState<Appointment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPhoneNumber = (propPhoneNumber: string, id: string) => {
    const onSuccess = () => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    };
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(propPhoneNumber).then(onSuccess).catch(() => fallbackCopy(propPhoneNumber, onSuccess));
    } else {
      fallbackCopy(propPhoneNumber, onSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "2em";
      el.style.height = "2em";
      el.style.padding = "0";
      el.style.border = "none";
      el.style.outline = "none";
      el.style.boxShadow = "none";
      el.style.background = "transparent";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      document.body.appendChild(el);
      el.focus();
      el.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      if (ok) onSuccess();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const now = new Date();
    const todayStart = format(startOfDay(now), "yyyy-MM-dd");
    const todayEnd = format(endOfDay(now), "yyyy-MM-dd");
    const weekStart = format(
      startOfWeek(now, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const monthStart = format(
      new Date(now.getFullYear(), now.getMonth(), 1),
      "yyyy-MM-dd",
    );
    const monthEnd = format(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
      "yyyy-MM-dd",
    );

    (async () => {
      try {
        const { data: all } = await supabase
          .from("appointments")
          .select("id, date, time_slot, email, client_name, created_at, status, phone_number")
          .gte("date", monthStart)
          .lte("date", monthEnd)
          .order("date", { ascending: false })
          .order("time_slot", { ascending: false });

        const list = (all as Appointment[]) ?? [];
        if (!cancelled) {
          setStats({
            monthTotal: list.length,
            todayTotal: list.filter((a) => a.date === todayStart).length,
            weekTotal: list.filter((a) =>
              a.date >= weekStart && a.date <= weekEnd
            ).length,
          });
          setLatestAppointments(list.slice(0, 5));
        }
      } catch {
        if (!cancelled) setLatestAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStatus = async (
    id: string,
    status: "completed" | "cancelled",
  ) => {
    setUpdatingId(id);
    try {
      const supabase = createClient();
      await supabase.from("appointments").update({ status }).eq("id", id);
      setLatestAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
          Overview
        </h1>
        <p className="text-neutral-500 text-sm font-medium mt-0.5">
          Resumen de citas y actividad reciente.
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white min-h-[120px] md:min-h-[150px] rounded-lg p-4 md:p-5 shadow-sm border">
          <div className="flex flex-col items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#8578D8] flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "—" : stats.monthTotal}
              </p>
              <p className="text-sm font-medium text-neutral-500">
                Citas este mes
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border">
          <div className="flex flex-col items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#618199] flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "—" : stats.todayTotal}
              </p>
              <p className="text-sm font-medium text-neutral-500">Citas hoy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border">
          <div className="flex flex-col items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {loading ? "—" : stats.weekTotal}
              </p>
              <p className="text-sm font-medium text-neutral-500">
                Esta semana
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas citas */}
      <section className="bg-white rounded-xl mt-6 md:mt-10 overflow-hidden">
        <div className="px-3 md:px-4 py-3 border-b border-neutral-200 flex items-center justify-between gap-2">
          <h2 className="text-base md:text-lg font-semibold text-neutral-800">
            Últimas citas
          </h2>
          <Link
            href="/admin/citas"
            className="text-sm font-medium text-neutral-700 hover:underline py-2 touch-manipulation"
          >
            Ver todas
          </Link>
        </div>
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          {loading
            ? <div className="p-8 text-center text-neutral-500">Cargando…</div>
            : latestAppointments.length === 0
            ? (
              <div className="p-8 text-center text-neutral-500">
                Aún no hay citas.
              </div>
            )
            : (
              <>
                {/* Mobile: lista expandible (solo Fecha, Hora, Cliente; al tocar se abre Correo + Acciones) */}
                <div className="md:hidden border-t border-neutral-100">
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-5 px-3 py-2 bg-neutral-50 border-b border-neutral-100 text-xs font-medium text-neutral-600">
                    <span>Fecha</span>
                    <span>Hora</span>
                    <span>Cliente</span>
                    <span className="w-6" aria-hidden />
                  </div>
                  {latestAppointments.map((a) => {
                    const isExpanded = expandedId === a.id;
                    return (
                      <div
                        key={a.id}
                        className="border-b border-neutral-100"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((id) => (id === a.id ? null : a.id))}
                          className="w-full flex items-center gap-5 px-3 py-3 text-left hover:bg-neutral-50/80 transition-colors touch-manipulation"
                        >
                          <span className="flex-1 min-w-0 text-neutral-700 font-medium shrink-0 text-sm">
                            {format(new Date(a.date), "d MMM yyyy", {
                              locale: es,
                            })}
                          </span>
                          <span className="shrink-0 text-neutral-600 text-sm">
                            {a.time_slot}
                          </span>
                          <span className="flex-1 min-w-0 truncate text-neutral-600 text-sm">
                            {a.client_name ?? "—"}
                          </span>
                          <span className="shrink-0 text-neutral-400 p-1">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>
                        {isExpanded && (
                          <div
                            className="px-3 pb-4 pt-3 flex flex-col gap-5 bg-neutral-50/50 border-t border-neutral-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col gap-1">
                              <p className="text-[13px] font-medium text-neutral-500">
                                Número
                              </p>
                              <div className="flex relative items-center gap-2 flex-wrap">
                                <p className="text-sm text-neutral-700 break-all flex-1 min-w-0">
                                  {a.phone_number}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyPhoneNumber(a.phone_number, a.id);
                                  }}
                                  className="shrink-0 inline-flex absolute right-0 items-center gap-1 px-2.5 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 text-xs font-medium touch-manipulation min-h-[36px]"
                                  aria-label="Copiar número"
                                >
                                  {copiedId === a.id ? (
                                    <>Copiado</>
                                  ) : (
                                    <><Copy className="w-3 h-3" /> Copiar</>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <p className="text-[13px] font-medium text-neutral-500 ">
                                Acciones
                              </p>
                              {(a.status === "completed" ||
                                  a.status === "cancelled")
                                ? (
                                  <span
                                    className={`text-xs font-medium ${
                                      a.status === "completed"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {a.status === "completed"
                                      ? "Completada"
                                      : "Cancelada"}
                                  </span>
                                )
                                : (
                                  <div className="flex flex-col gap-2">
                                    <button
                                      type="button"
                                      disabled={updatingId === a.id}
                                      onClick={() =>
                                        updateStatus(a.id, "completed")}
                                      className="px-3 py-3 text-xs font-medium rounded bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50 min-h-[36px] touch-manipulation"
                                    >
                                      Finalizar
                                    </button>
                                    <button
                                      type="button"
                                      disabled={updatingId === a.id}
                                      onClick={() =>
                                        updateStatus(a.id, "cancelled")}
                                      className="px-3 py-3 text-xs font-medium rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 min-h-[36px] touch-manipulation"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Desktop: tabla completa */}
                <table className="w-full text-left text-sm min-w-[480px] hidden md:table">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">
                        Fecha
                      </th>
                      <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">
                        Hora
                      </th>
                      <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">
                        Cliente
                      </th>
                      <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">
                        Número
                      </th>
                      <th className="px-3 md:px-4 py-3 font-medium text-neutral-700 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestAppointments.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-neutral-100 text-neutral-600 font-medium hover:bg-neutral-50/80"
                      >
                        <td className="px-3 md:px-4 py-3 whitespace-nowrap">
                          {format(new Date(a.date), "d MMM yyyy", {
                            locale: es,
                          })}
                        </td>
                        <td className="px-3 md:px-4 py-3">{a.time_slot}</td>
                        <td className="px-3 md:px-4 py-3">
                          {a.client_name ?? "—"}
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <span className="truncate">{a.phone_number}</span>
                            <button
                              type="button"
                              onClick={() => copyPhoneNumber(a.phone_number, a.id)}
                              className="shrink-0 p-1.5 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 touch-manipulation min-h-[28px] min-w-[28px] flex items-center justify-center"
                              aria-label="Copiar número"
                              title="Copiar número"
                            >
                              {copiedId === a.id ? (
                                <span className="text-xs text-green-600 font-medium">Copiado</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-right">
                          {(a.status === "completed" ||
                              a.status === "cancelled")
                            ? (
                              <span
                                className={`text-xs font-medium ${
                                  a.status === "completed"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {a.status === "completed"
                                  ? "Completada"
                                  : "Cancelada"}
                              </span>
                            )
                            : (
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <button
                                  type="button"
                                  disabled={updatingId === a.id}
                                  onClick={() =>
                                    updateStatus(a.id, "completed")}
                                  className="px-2.5 py-2 text-xs font-medium rounded bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50 min-h-[36px] touch-manipulation"
                                >
                                  Finalizar
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingId === a.id}
                                  onClick={() =>
                                    updateStatus(a.id, "cancelled")}
                                  className="px-2.5 py-2 text-xs font-medium rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 min-h-[36px] touch-manipulation"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </div>
      </section>
    </div>
  );
}
