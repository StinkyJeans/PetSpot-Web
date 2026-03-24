"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/feedback/toast-provider";

const initialForm = {
  date: "",
  time: "",
  city: "",
  country: "",
  eventType: "meet-up",
  purpose: "",
};

/**
 * Reusable event modal component.
 * Consumers control `isOpen` and pass `onClose` + optional `onSubmit`.
 */
export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Create event",
  submitLabel = "Create event",
  initialData = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [countryOptions, setCountryOptions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const onCloseRef = useRef(onClose);
  const { showToast } = useToast();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setSubmitting(false);
      setCountryOptions([]);
      setLoadingSuggestions(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !initialData) return;
    setForm((prev) => ({
      ...prev,
      date: initialData.date || "",
      time: initialData.time || "",
      city: initialData.city || "",
      country: initialData.country || "",
      eventType: initialData.eventType || "meet-up",
      purpose: initialData.purpose || "",
    }));
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const q = form.city.trim();
    if (q.length < 2) {
      setCountryOptions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Location lookup failed");
        const data = await res.json();
        const normalized = (data?.results ?? []).filter(Boolean);
        const cityMatches = normalized.filter(
          (item) => String(item.city || "").toLowerCase() === q.toLowerCase(),
        );
        const matches = cityMatches.length ? cityMatches : normalized;
        const countryList = [];
        const seenCountry = new Set();
        for (const item of matches) {
          const country = String(item.country || "").trim();
          if (!country || seenCountry.has(country.toLowerCase())) continue;
          seenCountry.add(country.toLowerCase());
          countryList.push(country);
        }

        setCountryOptions(countryList);
        if (countryList.length === 1) {
          setForm((p) => ({ ...p, country: countryList[0] }));
        }
      } catch {
        setCountryOptions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.city, isOpen]);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        place: [form.city, form.country].filter(Boolean).join(", "),
        dateTime: [form.date, form.time].filter(Boolean).join(" "),
      };
      const result = await onSubmit?.(payload);
      if (result?.error) {
        showToast(result.error, "error");
        return;
      }
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Time:</p>
            <div className="mt-1 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Date: (MM/DD/YY)
                </label>
                <input
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  type="date"
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Time: (HH:MM)
                </label>
                <input
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  type="time"
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              City
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="Butuan"
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
            />
            {loadingSuggestions ? (
              <p className="mt-1 text-xs text-zinc-500">Checking country options...</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Country
              </label>
              {countryOptions.length > 1 ? (
                <select
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  placeholder="Philippines"
                  required
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
                />
              )}
              {countryOptions.length > 1 ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Multiple countries found for this city. Please select one.
                </p>
              ) : null}
            </div>
            <div className="hidden sm:block" />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Type of event
            </label>
            <select
              value={form.eventType}
              onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
            >
              <option value="meet-up">Meet up</option>
              <option value="dog-show">Dog show</option>
              <option value="pet-adoption">Pet adoption</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Purpose
            </label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
              placeholder="Tell people what this event is for..."
              rows={4}
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}
