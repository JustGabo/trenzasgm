"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { Clock, ChevronDown, ChevronUp, Copy } from "lucide-react";
import "react-day-picker/style.css";

const HOUR_START = 9;
const HOUR_END = 18;
const SLOT_INTERVAL_MINUTES = 30;

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL_MINUTES) {
      if (h === HOUR_END && m > 0) break;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

const PAGE_SIZE = 10;

type Appointment = {
  id: string;
  email: string;
  client_name: string | null;
  date: string;
  time_slot: string;
  created_at: string;
  status?: string;
};

export default function AdminCitasPage() {
  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 2);
  const fromDate = format(today, "yyyy-MM-dd");

  const [month, setMonth] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [blockedDays, setBlockedDays] = useState<Date[]>([]);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyEmail = (email: string, id: string) => {
    const onSuccess = () => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    };
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(email).then(onSuccess).catch(() => fallbackCopy(email, onSuccess));
    } else {
      fallbackCopy(email, onSuccess);
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

  const loadAppointments = async () => {
    const start = format(startOfMonth(month), "yyyy-MM-dd");
    const end = format(endOfMonth(month), "yyyy-MM-dd");
    setLoading(true);
    setAppointments([]);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("appointments")
        .select("id, email, client_name, date, time_slot, created_at, status")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })
        .order("time_slot", { ascending: true });
      setAppointments((data as Appointment[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    setPage(1);
  }, [month]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("availability_blocks")
      .select("date")
      .is("time_slot", null)
      .gte("date", fromDate)
      .lte("date", format(maxDate, "yyyy-MM-dd"))
      .then(({ data }) => {
        setBlockedDays((data ?? []).map((r) => new Date(r.date)));
      });
  }, [fromDate, maxDate]);

  const fetchTakenSlotsForDate = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setLoadingSlots(true);
    try {
      const supabase = createClient();
      const [appointmentsRes, blocksRes] = await Promise.all([
        supabase.from("appointments").select("time_slot, status").eq(
          "date",
          dateStr,
        ),
        supabase.from("availability_blocks").select("time_slot").eq(
          "date",
          dateStr,
        ),
      ]);
      const appointmentsList = (appointmentsRes.data ?? []) as {
        time_slot: string;
        status?: string;
      }[];
      const fromAppointments = appointmentsList
        .filter((a) => a.status == null || a.status === "pending")
        .map((a) => a.time_slot);
      const fromBlocks = (blocksRes.data ?? []) as {
        time_slot: string | null;
      }[];
      const fullDayBlocked = fromBlocks.some((b) => b.time_slot === null);
      const fromBlockSlots = fromBlocks.map((b) => b.time_slot).filter((
        t,
      ): t is string => t != null);
      const taken = fullDayBlocked
        ? [...TIME_SLOTS]
        : [...new Set([...fromAppointments, ...fromBlockSlots])];
      setTakenSlots(taken);
    } catch {
      setTakenSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (date) fetchTakenSlotsForDate(date);
    else setTakenSlots([]);
  };

  const disabledDays = useMemo(
    () => [
      { before: today },
      { after: maxDate },
      (date: Date) => date.getDay() === 0,
      (date: Date) =>
        blockedDays.some((d) =>
          format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        ),
    ],
    [today, maxDate, blockedDays],
  );

  const updateStatus = async (
    id: string,
    status: "completed" | "cancelled",
  ) => {
    setUpdatingId(id);
    try {
      const supabase = createClient();
      await supabase.from("appointments").update({ status }).eq("id", id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !email.trim()) return;
    setSubmittingNew(true);
    try {
      const supabase = createClient();
      await supabase.from("appointments").insert({
        date: format(selectedDate, "yyyy-MM-dd"),
        time_slot: selectedTime,
        email: email.trim(),
        client_name: clientName.trim() || null,
      });
      setSelectedDate(undefined);
      setSelectedTime(null);
      setEmail("");
      setClientName("");
      setTakenSlots([]);
      loadAppointments();
    } finally {
      setSubmittingNew(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedAppointments = useMemo(
    () => appointments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [appointments, safePage],
  );
  const from = appointments.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, appointments.length);

  return (
    <div className="space-y-6 md:space-y-8 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Citas</h1>
        <p className="text-neutral-500 text-sm font-medium mt-0.5">
          Añade citas desde el panel y consulta todas las del mes.
        </p>
      </div>

      {/* Nueva cita */}
      <section className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-neutral-100">
          <h2 className="text-base md:text-lg font-semibold text-neutral-800">Nueva cita</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Elige fecha y hora, y los datos del cliente. La cita aparecerá en la
            tabla de abajo.
          </p>
        </div>
        <form onSubmit={handleAddAppointment} className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3">
                Seleccionar fecha
              </p>
              <div className="appointment-calendar text-neutral-800 flex flex-col items-start">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  disabled={disabledDays}
                  locale={es}
                  startMonth={today}
                  endMonth={maxDate}
                  className="rounded-xl border border-neutral-200 p-3 sm:p-4 bg-neutral-50 w-full max-w-[min(100%,20rem)]"
                  classNames={{
                    root: "rdp-root",
                    month_caption:
                      "rdp-month_caption flex justify-between items-center mb-4 text-neutral-900 font-semibold",
                    nav: "rdp-nav flex gap-2",
                    button_previous:
                      "rdp-button_previous rounded-lg p-2.5 min-h-11 min-w-[2.75rem] hover:bg-neutral-200 text-neutral-700",
                    button_next:
                      "rdp-button_next rounded-lg p-2.5 min-h-11 min-w-[2.75rem] hover:bg-neutral-200 text-neutral-700",
                    month_grid: "rdp-month_grid w-full",
                    weekdays: "rdp-weekdays",
                    weekday: "rdp-weekday text-neutral-600 font-medium text-xs",
                    weeks: "rdp-weeks",
                    week: "rdp-week",
                    day: "rdp-day",
                    day_button:
                      "rdp-day_button hover:bg-neutral-200 focus:bg-neutral-300 rounded-full text-neutral-800",
                    selected:
                      "rdp-selected [&_.rdp-day_button]:!bg-neutral-800 [&_.rdp-day_button]:!text-white",
                    disabled:
                      "rdp-disabled [&_.rdp-day_button]:text-neutral-300 [&_.rdp-day_button]:cursor-not-allowed",
                    today:
                      "rdp-today [&_.rdp-day_button]:font-semibold [&_.rdp-day_button]:text-neutral-600",
                    outside: "rdp-outside [&_.rdp-day_button]:text-neutral-400",
                  }}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <label className="text-sm font-medium text-neutral-700">
                    Hora
                  </label>
                </div>
                {!selectedDate
                  ? (
                    <p className="text-sm text-neutral-500">
                      Elige primero una fecha en el calendario.
                    </p>
                  )
                  : loadingSlots
                  ? (
                    <p className="text-sm text-neutral-500">
                      Cargando horarios…
                    </p>
                  )
                  : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-w-2xl">
                      {TIME_SLOTS.map((slot) => {
                        const isTaken = takenSlots.includes(slot);
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isTaken}
                            onClick={() => !isTaken && setSelectedTime(slot)}
                            className={`py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] sm:min-h-0 touch-manipulation ${
                              isTaken
                                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                : isSelected
                                ? "bg-neutral-800 text-white shadow-sm"
                                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200"
                            }`}
                            title={isTaken
                              ? "Ya reservada o bloqueada"
                              : undefined}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
              <div>
                <label
                  htmlFor="new-cita-email"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Correo
                </label>
                <input
                  id="new-cita-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full max-w-xs px-3 py-2.5 text-base md:text-sm border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-300"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="new-cita-name"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Nombre del cliente (opcional)
                </label>
                <input
                  id="new-cita-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full max-w-xs px-3 py-2.5 text-base md:text-sm border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-300"
                />
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submittingNew || !selectedDate || !selectedTime ||
                    !email.trim()}
                  className="px-5 py-3 md:py-2.5 min-h-[44px] bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  {submittingNew ? "Guardando…" : "Añadir cita"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Tabla de citas del mes */}
      <section className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-base md:text-lg font-semibold text-neutral-800">
            Citas del mes
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              className="p-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Mes anterior"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="min-w-[140px] text-center font-medium text-neutral-800 capitalize">
              {format(month, "MMMM yyyy", { locale: es })}
            </span>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="p-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Mes siguiente"
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          {/* Loading: móvil y escritorio */}
          {loading && (
            <>
              <div className="md:hidden py-12 flex flex-col items-center justify-center text-neutral-500 gap-2">
                <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin" />
                <p className="text-sm">Cargando…</p>
              </div>
              <table className="w-full text-left text-sm min-w-[520px] hidden md:table">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Fecha</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Hora</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Cliente</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Correo</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin" />
                        <p>Cargando…</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          {/* Vacío: móvil y escritorio */}
          {!loading && appointments.length === 0 && (
            <>
              <div className="md:hidden py-12 px-4 text-center text-neutral-500 text-sm">
                No hay citas en {format(month, "MMMM yyyy", { locale: es })}.
              </div>
              <table className="w-full text-left text-sm min-w-[520px] hidden md:table">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Fecha</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Hora</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Cliente</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Correo</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                      No hay citas en {format(month, "MMMM yyyy", { locale: es })}.
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          {/* Con datos: móvil lista expandible, escritorio tabla */}
          {!loading && appointments.length > 0 && (
            <>
              <div className="md:hidden border-t border-neutral-100">
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-5 px-3 py-2 bg-neutral-50 border-b border-neutral-100 text-xs font-medium text-neutral-600">
                  <span>Fecha</span>
                  <span>Hora</span>
                  <span>Cliente</span>
                  <span className="w-6" aria-hidden />
                </div>
                {paginatedAppointments.map((a) => {
                  const isExpanded = expandedId === a.id;
                  return (
                    <div key={a.id} className="border-b border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setExpandedId((id) => (id === a.id ? null : a.id))}
                        className="w-full flex items-center gap-5 px-3 py-3 text-left hover:bg-neutral-50/80 transition-colors touch-manipulation"
                      >
                        <span className="flex-1 min-w-0 text-neutral-700 font-medium shrink-0 text-sm">
                          {format(new Date(a.date), "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="shrink-0 text-neutral-600 text-sm">{a.time_slot}</span>
                        <span className="flex-1 min-w-0 truncate text-neutral-600 text-sm">{a.client_name ?? "—"}</span>
                        <span className="shrink-0 text-neutral-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </button>
                      {isExpanded && (
                        <div
                        className="px-3 pb-4 pt-3 flex flex-col gap-5 bg-neutral-50/50 border-t border-neutral-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-[13px] font-medium text-neutral-500">
                            Correo
                          </p>
                          <div className="flex relative items-center gap-2 flex-wrap">
                            <p className="text-sm text-neutral-700 break-all flex-1 min-w-0">
                              {a.email}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyEmail(a.email, a.id);
                              }}
                              className="shrink-0 inline-flex absolute right-0 items-center gap-1 px-2.5 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 text-xs font-medium touch-manipulation min-h-[36px]"
                              aria-label="Copiar correo"
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
              <table className="w-full text-left text-sm min-w-[520px] hidden md:table">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Fecha</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Hora</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Cliente</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700">Correo</th>
                    <th className="px-3 md:px-4 py-3 font-medium text-neutral-700 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-neutral-100 text-neutral-600 hover:bg-neutral-50/50"
                    >
                      <td className="px-3 md:px-4 py-3 whitespace-nowrap">
                        {format(new Date(a.date), "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-3 md:px-4 py-3">{a.time_slot}</td>
                      <td className="px-3 md:px-4 py-3">{a.client_name ?? "—"}</td>
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <span className="truncate">{a.email}</span>
                          <button
                            type="button"
                            onClick={() => copyEmail(a.email, a.id)}
                            className="shrink-0 p-1.5 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 touch-manipulation min-h-[28px] min-w-[28px] flex items-center justify-center"
                            aria-label="Copiar correo"
                            title="Copiar correo"
                          >
                            {copiedId === a.id ? <span className="text-xs text-green-600 font-medium">Copiado</span> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-right">
                        {(a.status === "completed" || a.status === "cancelled")
                          ? (
                            <span className={`text-xs font-medium ${a.status === "completed" ? "text-green-600" : "text-red-600"}`}>
                              {a.status === "completed" ? "Completada" : "Cancelada"}
                            </span>
                          )
                          : (
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <button
                                type="button"
                                disabled={updatingId === a.id}
                                onClick={() => updateStatus(a.id, "completed")}
                                className="px-2.5 py-2 text-xs font-medium rounded bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-50 min-h-[36px] touch-manipulation"
                              >
                                Finalizar
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === a.id}
                                onClick={() => updateStatus(a.id, "cancelled")}
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
          <div className="px-3 md:px-4 py-3 border-t border-neutral-100 flex flex-col items-start sm:flex-row md:items-center justify-between gap-3">
            <p className="text-sm w-full   text-neutral-500">
              {loading
                ? "Cargando…"
                : appointments.length === 1
                  ? "1 cita"
                  : `${appointments.length} citas`}
              {!loading && appointments.length > PAGE_SIZE && (
                <span className="text-neutral-400"> (mostrando {from}–{to})</span>
              )}
            </p>
            <div className="flex items-center w-full justify-between md:justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
              >
                Anterior
              </button>
              <span className="text-sm text-neutral-600 min-w-16 text-center">
                Pág. {safePage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
