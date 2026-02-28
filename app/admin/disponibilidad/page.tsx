"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { Calendar, Clock, Trash2 } from "lucide-react";
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

type Block = {
  id: string;
  date: string;
  time_slot: string | null;
  created_at: string;
};

export default function AdminDisponibilidadPage() {
  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 2);
  const fromDate = format(today, "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [fullDay, setFullDay] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockedDays, setBlockedDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  const loadBlocks = async () => {
    const supabase = createClient();
    try {
      const { data } = await supabase
        .from("availability_blocks")
        .select("id, date, time_slot, created_at")
        .gte("date", fromDate)
        .order("date", { ascending: true })
        .order("time_slot", { ascending: true });
      const list = (data as Block[]) ?? [];
      setBlocks(list);
      setBlockedDays(
        list.filter((b) => b.time_slot === null).map((b) => new Date(b.date)),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

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
      const appointments = (appointmentsRes.data ?? []) as {
        time_slot: string;
        status?: string;
      }[];
      const fromAppointments = appointments
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
    setSelectedSlots(new Set());
    if (date) fetchTakenSlotsForDate(date);
    else setTakenSlots([]);
  };

  const disabledDays = useMemo(
    () => [
      { before: today },
      { after: maxDate },
      (date: Date) =>
        blockedDays.some((d) =>
          format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        ),
    ],
    [today, maxDate, blockedDays],
  );

  const blockDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  };

  const submitBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDateStr) return;
    const supabase = createClient();
    setSubmitting(true);
    try {
      if (fullDay) {
        await supabase.from("availability_blocks").insert({
          date: blockDateStr,
          time_slot: null,
        });
      } else {
        const blockSlots = Array.from(selectedSlots);
        if (blockSlots.length === 0) {
          setSubmitting(false);
          return;
        }
        await supabase.from("availability_blocks").insert(
          blockSlots.map((time_slot) => ({ date: blockDateStr, time_slot })),
        );
      }
      setSelectedDate(undefined);
      setFullDay(false);
      setSelectedSlots(new Set());
      setTakenSlots([]);
      loadBlocks();
    } finally {
      setSubmitting(false);
    }
  };

  const byDate = blocks.reduce<Record<string, Block[]>>((acc, b) => {
    if (!acc[b.date]) acc[b.date] = [];
    acc[b.date].push(b);
    return acc;
  }, {});

  const sortedDates = Object.entries(byDate).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="px-0">
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
          Disponibilidad
        </h1>
        <p className="text-neutral-500 text-sm font-medium mt-0.5">
          Bloquea días completos o horas concretas para que no se puedan
          reservar.
        </p>
      </div>

      {/* Nuevo bloqueo */}
      <section className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-neutral-100">
          <h2 className="text-base md:text-lg font-semibold text-neutral-800">
            Nuevo bloqueo
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Elige una fecha y, si quieres, solo algunas horas. Esas franjas no
            aparecerán en el formulario de reservas.
          </p>
        </div>
        <form onSubmit={submitBlock} className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-3">
                Seleccionar fecha
              </p>
              <div className="appointment-calendar text-neutral-800 flex flex-col gap-5 items-start">
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
                      "rdp-month_caption flex justify-between items-center mb-4 text-neutral-900 font-semibold text-sm sm:text-base",
                    nav: "rdp-nav flex gap-2",
                    button_previous:
                      "rdp-button_previous rounded-lg p-2.5 min-h-[44px] min-w-[44px] hover:bg-neutral-200 text-neutral-700 touch-manipulation",
                    button_next:
                      "rdp-button_next rounded-lg p-2.5 min-h-[44px] min-w-[44px] hover:bg-neutral-200 text-neutral-700 touch-manipulation",
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
                <div className="flex flex-col justify-start">
                  <div className="flex items-center gap-1.5">
                    {
                      /* <button className={`w-5 h-5 rounded-full border-2 border-neutral-300 text-neutral-700 ${fullDay ? "bg-accent" : ""}`} onClick={() => setFullDay(!fullDay)}>
                    </button> */
                    }
                    <input
                      type="checkbox"
                      checked={fullDay}
                      onChange={(e) => {
                        setFullDay(e.target.checked);
                        if (e.target.checked) setSelectedSlots(new Set());
                      }}
                      className="w-4 h-4 rounded border-neutral-300 text-neutral-700 focus:ring-neutral-400"
                    />
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                        Bloquear día completo
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Si lo marcas, ese día no se podrá elegir en el calendario.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <label className="text-sm font-medium text-neutral-700">
                    Horas a bloquear
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
                    <>
                      <p className="text-xs text-neutral-500 mb-3">
                        {fullDay
                          ? "Día completo seleccionado: todas las franjas quedarán bloqueadas (solo visual)."
                          : "Pulsa las franjas que quieras bloquear. Las que ya tienen cita aparecen en gris y no se pueden elegir."}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-w-2xl">
                        {TIME_SLOTS.map((slot) => {
                          const isTaken = takenSlots.includes(slot);
                          const isDisabled = fullDay || isTaken;
                          const isSelected = selectedSlots.has(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => !isDisabled && toggleSlot(slot)}
                              className={`py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] sm:min-h-0 touch-manipulation ${
                                isDisabled
                                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-neutral-800 text-white shadow-sm"
                                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200"
                              }`}
                              title={isTaken
                                ? "Ya hay una cita reservada"
                                : undefined}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {!fullDay && selectedSlots.size > 0 && (
                        <p className="text-xs text-neutral-500 mt-2">
                          {selectedSlots.size}{" "}
                          hora{selectedSlots.size !== 1 ? "s" : ""}{" "}
                          seleccionada{selectedSlots.size !== 1 ? "s" : ""}.
                        </p>
                      )}
                    </>
                  )}
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting ||
                !selectedDate ||
                (!fullDay && selectedSlots.size === 0)}
              className="px-5 py-3 md:py-2.5 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
            >
              {submitting ? "Guardando…" : "Añadir bloqueo"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-neutral-100">
          <h2 className="text-base md:text-lg font-semibold text-neutral-800">
            Bloqueos activos
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Desde hoy en adelante. Puedes eliminar cualquiera.
          </p>
        </div>
        <div className="min-h-[200px] p-4 md:p-6">
          {loading
            ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-neutral-500">
                <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin mb-3" />
                <p className="text-sm">Cargando…</p>
              </div>
            )
            : sortedDates.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4 rounded-xl bg-neutral-50/50 border border-dashed border-neutral-200">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <Calendar className="w-7 h-7 text-neutral-400" />
                </div>
                <p className="text-neutral-600 font-medium">No hay bloqueos</p>
                <p className="text-sm text-neutral-500 mt-1 text-center max-w-xs">
                  Añade uno desde el formulario de arriba para que ciertos días
                  u horas no sean reservables.
                </p>
              </div>
            )
            : (
              <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                {sortedDates.map(([date, items]) => {
                  const fullDayBlock = items.find((b) => b.time_slot === null);
                  const slots = items
                    .filter((b) => b.time_slot != null)
                    .map((b) => b.time_slot as string)
                    .sort();
                  const dateObj = new Date(date);
                  return (
                    <li
                      key={date}
                      className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                            {format(dateObj, "EEEE", { locale: es })}
                          </p>
                          <p className="font-semibold text-neutral-900 text-lg mt-0.5">
                            {format(dateObj, "d MMMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const supabase = createClient();
                            for (const b of items) {
                              await supabase
                                .from("availability_blocks")
                                .delete()
                                .eq("id", b.id);
                            }
                            loadBlocks();
                          }}
                          className="shrink-0 p-2.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Eliminar bloqueo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        {fullDayBlock
                          ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-sm font-medium">
                              <Calendar className="w-4 h-4 shrink-0" />
                              Día completo
                            </span>
                          )
                          : slots.length > 0
                          ? (
                            <div className="flex flex-wrap gap-1.5">
                              {slots.map((slot) => (
                                <span
                                  key={slot}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium"
                                >
                                  <Clock className="w-3 h-3 mr-1 shrink-0 opacity-70" />
                                  {slot}
                                </span>
                              ))}
                            </div>
                          )
                          : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </section>
    </div>
  );
}
