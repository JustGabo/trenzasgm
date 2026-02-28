"use client";

import React, { useEffect, useRef } from "react";

export type ToastType = "success" | "error";

type ToastProps = {
  open: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
  /** Tiempo en ms antes de cerrar solo. 0 = no auto-cierre */
  autoHideDuration?: number;
};

export default function Toast({
  open,
  type,
  message,
  onClose,
  autoHideDuration = 4500,
}: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || autoHideDuration <= 0) return;
    const t = setTimeout(() => onCloseRef.current(), autoHideDuration);
    return () => clearTimeout(t);
  }, [open, autoHideDuration]);

  if (!open || !message) return null;

  const isSuccess = type === "success";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-[calc(100vw-2rem)] toast-appear ${
        isSuccess
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {isSuccess ? (
        <svg
          className="shrink-0 w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="shrink-0 w-5 h-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-400"
        aria-label="Cerrar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
