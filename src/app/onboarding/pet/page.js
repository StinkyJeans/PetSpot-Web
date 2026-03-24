import { redirect } from "next/navigation";
import PetOnboardingForm from "@/app/onboarding/pet/pet-onboarding-form";
import { hasPrimaryPetProfile, requireUser } from "@/lib/auth/server";

export default async function PetOnboardingPage() {
  const user = await requireUser();
  const hasPrimary = await hasPrimaryPetProfile(user.id);

  if (hasPrimary) {
    redirect("/feed");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Set up your profile</h1>
        <p className="mt-2 text-sm text-zinc-600">
          PetSpot is for you and your pet — one profile for both. Add your name and your pet&apos;s basics
          to get started.
        </p>
        <PetOnboardingForm />
      </section>
    </main>
  );
}
