"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, addMonths, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase";
import Toast from "@/app/components/toast";
import "react-day-picker/style.css";

const HOUR_START = 9;
const HOUR_END = 18;
const SLOT_INTERVAL_MINUTES = 30;

const INSTAGRAM_USERNAME = "trenzas_g.m"; // @ de Instagram (sin @)

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

export default function Appointment() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [instagramMessage, setInstagramMessage] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 2);
  const [blockedDays, setBlockedDays] = useState<Date[]>([]);

  // Días con bloqueo completo (se deshabilitan en el calendario)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("availability_blocks")
      .select("date")
      .is("time_slot", null)
      .gte("date", format(today, "yyyy-MM-dd"))
      .lte("date", format(maxDate, "yyyy-MM-dd"))
      .then(({ data }) => {
        setBlockedDays((data ?? []).map((r) => new Date(r.date)));
      });
  }, []);

  // Horas ya reservadas o bloqueadas: citas + bloques de disponibilidad.
  const fetchTakenSlots = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setLoadingSlots(true);
    try {
      const supabase = createClient();
      const [appointmentsRes, blocksRes] = await Promise.all([
        supabase.from("appointments").select("time_slot").eq("date", dateStr),
        supabase.from("availability_blocks").select("time_slot").eq("date", dateStr),
      ]);
      const fromAppointments = (appointmentsRes.data ?? []).map((r) => r.time_slot);
      const fromBlocks = (blocksRes.data ?? []) as { time_slot: string | null }[];
      const fullDayBlocked = fromBlocks.some((b) => b.time_slot === null);
      const fromBlockSlots = fromBlocks.map((b) => b.time_slot).filter((t): t is string => t != null);
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
    if (date) fetchTakenSlots(date);
    else setTakenSlots([]);
  };

  const disabledDays = useMemo(
    () => [
      { before: today },
      { after: maxDate },
      (date: Date) => date.getDay() === 0,
      (date: Date) =>
        blockedDays.some((d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")),
    ],
    [today, maxDate, blockedDays]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !email.trim()) {
      setMessage({ type: "error", text: "Selecciona fecha, hora e introduce tu correo." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("appointments").insert({
        date: format(selectedDate, "yyyy-MM-dd"),
        time_slot: selectedTime,
        email: email.trim(),
        client_name: name.trim() || null,
      });
      if (error) throw error;

      const humanDate = format(selectedDate, "d 'de' MMMM yyyy", { locale: es });
      const text =
        `Hola, acabo de reservar una cita para el ${humanDate} a las ${selectedTime}. Mi correo es ${email.trim()}${
          name.trim() ? ` y mi nombre es ${name.trim()}` : ""
        }.`;
      setInstagramMessage(text);

      setMessage({
        type: "ok",
        text: "Cita reservada. Envía el mensaje por Instagram para confirmar.",
      });
      setSelectedDate(undefined);
      setSelectedTime(null);
      setEmail("");
      setName("");
      setTakenSlots([]);
    } catch (err) {
      setMessage({
        type: "error",
        text: "No se pudo reservar. Inténtalo de nuevo o escríbenos por WhatsApp.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 md:py-16 bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 text-center mb-6 md:mb-10">
          Reservar cita
        </h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-neutral-200 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-4 sm:p-6 md:p-8">
            <div className="appointment-calendar text-neutral-800 flex flex-col items-center md:items-start">
              <p className="text-sm font-medium text-neutral-600 mb-3 w-full md:w-auto">Seleccionar fecha</p>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabled={disabledDays}
                locale={es}
                startMonth={today}
                endMonth={maxDate}
                className="rounded-xl border border-neutral-200 p-3 sm:p-4 bg-neutral-50 w-full max-w-[min(100%,20rem)] md:max-w-none"
                classNames={{
                  root: "rdp-root mx-auto",
                  month_caption: "rdp-month_caption flex justify-between items-center mb-4 text-neutral-900 font-semibold",
                  nav: "rdp-nav flex gap-2",
                  button_previous: "rdp-button_previous rounded-lg p-2.5 min-h-11 min-w-[2.75rem] hover:bg-neutral-200 text-neutral-700 touch-manipulation",
                  button_next: "rdp-button_next rounded-lg p-2.5 min-h-11 min-w-[2.75rem] hover:bg-neutral-200 text-neutral-700 touch-manipulation",
                  month_grid: "rdp-month_grid w-full",
                  weekdays: "rdp-weekdays",
                  weekday: "rdp-weekday text-neutral-600 font-medium text-xs",
                  weeks: "rdp-weeks",
                  week: "rdp-week",
                  day: "rdp-day",
                  day_button: "rdp-day_button hover:bg-accent/20 focus:bg-accent/30 rounded-full text-neutral-800",
                  selected: "rdp-selected [&_.rdp-day_button]:!bg-accent [&_.rdp-day_button]:!text-white [&_.rdp-day_button]:!border-accent",
                  disabled: "rdp-disabled [&_.rdp-day_button]:text-neutral-300 [&_.rdp-day_button]:cursor-not-allowed",
                  today: "rdp-today [&_.rdp-day_button]:font-semibold [&_.rdp-day_button]:text-accent",
                  outside: "rdp-outside [&_.rdp-day_button]:text-neutral-400",
                }}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-neutral-600 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="Introduce tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-base placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent mb-4"
              />
              <label className="text-sm font-medium text-neutral-600 mb-2">Nombre (opcional)</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-11 px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-base placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent mb-6"
              />

              <p className="text-sm font-medium text-neutral-600 mb-3">Seleccionar hora</p>
              {!selectedDate ? (
                <p className="text-neutral-500 text-sm">Elige primero una fecha.</p>
              ) : loadingSlots ? (
                <p className="text-neutral-500 text-sm">Cargando horarios…</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 sm:max-h-48 overflow-y-auto overscroll-contain touch-pan-y">
                  {TIME_SLOTS.map((slot) => {
                    const isTaken = takenSlots.includes(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isTaken}
                        onClick={() => setSelectedTime(slot)}
                        className={`min-h-11 py-2.5 px-2 sm:py-2 sm:px-3 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                          isTaken
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : isSelected
                              ? "bg-accent text-white"
                              : "bg-neutral-100 text-neutral-700 hover:bg-accent/20"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-neutral-500 text-xs mt-3">
                Todas las horas están en hora de España (peninsular).
              </p>
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8 pt-2">
            <button
              type="submit"
              disabled={loading || !selectedDate || !selectedTime || !email.trim()}
              className="w-full min-h-12 py-3 sm:py-4 rounded-full bg-accent text-white font-semibold text-base sm:text-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              {loading ? "Reservando…" : "Reservar cita"}
            </button>
          </div>
        </form>

        <Toast
          open={!!message}
          type={message?.type === "ok" ? "success" : "error"}
          message={message?.text ?? ""}
          onClose={() => setMessage(null)}
        />

        {instagramMessage && (
          <div className="mt-6 p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <p className="text-sm font-medium text-neutral-700 mb-2">
              Copia este mensaje y envíalo por Instagram para confirmar la cita:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                readOnly
                value={instagramMessage}
                rows={3}
                className="flex-1 w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 text-sm resize-none"
              />
              <div className="flex flex-col gap-2 sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(instagramMessage);
                    setMessage({
                      type: "ok",
                      text: "Mensaje copiado. Pégalo en Instagram.",
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700"
                >
                  Copiar mensaje
                </button>
                <a
                  href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm font-medium hover:bg-neutral-50 text-center"
                >
                  Abrir Instagram
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInstagramMessage(null)}
              className="mt-3 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
