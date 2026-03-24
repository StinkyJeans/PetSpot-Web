"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePetDetails } from "@/app/profile/actions";
import { Calendar, Heart, LocationPin, Map, User } from "griddy-icons";

function formatBirthday(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function ProfileDetailsCard({
  ownerDisplayName,
  location,
  favoritePlace,
  favoriteToy,
  petBirthday,
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const petBirthdayValue = petBirthday
    ? typeof petBirthday === "string"
      ? petBirthday.slice(0, 10)
      : new Date(petBirthday).toISOString().slice(0, 10)
    : "";

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updatePetDetails(null, fd);
      if (r?.error) {
        setError(r.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-emerald-950">Details</h2>
        <button
          type="button"
          onClick={() => {
            setError("");
            setEditing((v) => !v);
          }}
          className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        You and your pet share one profile — update both sides below.
      </p>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">You</p>
            <div className="mt-2 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Your name
                </label>
                <input
                  name="owner_display_name"
                  defaultValue={ownerDisplayName ?? ""}
                  placeholder="How you appear on PetSpot"
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Home / city
                </label>
                <input
                  name="location"
                  defaultValue={location ?? ""}
                  placeholder="Where you&apos;re based"
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">Your pet</p>
            <div className="mt-2 space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Favorite place to go
                </label>
                <input
                  name="favorite_place"
                  defaultValue={favoritePlace ?? ""}
                  placeholder="Park, beach, trail..."
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Favorite toy
                </label>
                <input
                  name="favorite_toy"
                  defaultValue={favoriteToy ?? ""}
                  placeholder="Squeaky ball, rope..."
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Pet&apos;s birthday
                </label>
                <input
                  name="pet_birthday"
                  type="date"
                  defaultValue={petBirthdayValue}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save details"}
          </button>
        </form>
      ) : (
        <div className="mt-4 space-y-5 text-sm text-zinc-800">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">You</p>
            <ul className="mt-2 space-y-3">
              <li className="flex items-start gap-3">
                <User size={18} color="#166534" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Name</p>
                  <p>{ownerDisplayName?.trim() ? ownerDisplayName : "—"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <LocationPin size={18} color="#166534" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Home / city</p>
                  <p>{location?.trim() ? location : "—"}</p>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">Your pet</p>
            <ul className="mt-2 space-y-3">
              <li className="flex items-start gap-3">
                <Map size={18} color="#166534" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Favorite place
                  </p>
                  <p>{favoritePlace?.trim() ? favoritePlace : "—"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Heart size={18} color="#166534" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Favorite toy</p>
                  <p>{favoriteToy?.trim() ? favoriteToy : "—"}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar size={18} color="#166534" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Pet&apos;s birthday
                  </p>
                  <p>{formatBirthday(petBirthday) ?? "—"}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
