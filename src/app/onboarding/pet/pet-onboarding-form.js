"use client";

import { useActionState } from "react";
import { createPrimaryPetProfile } from "@/app/onboarding/pet/actions";

const initialState = { error: "" };

export default function PetOnboardingForm() {
  const [state, action, pending] = useActionState(
    createPrimaryPetProfile,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input
        type="text"
        name="ownerDisplayName"
        placeholder="Your name (how you appear on PetSpot)"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
      />
      <input
        type="text"
        name="petName"
        placeholder="Pet name"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        required
      />
      <input
        type="text"
        name="breed"
        placeholder="Breed"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        required
      />
      <input
        type="number"
        name="ageYears"
        min="0"
        step="1"
        placeholder="Age (years)"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none"
        required
      />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save and continue"}
      </button>
    </form>
  );
}
