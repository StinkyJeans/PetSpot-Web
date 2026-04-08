import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPrimaryPetProfile } from "@/lib/auth/server";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    const hasPrimary = await hasPrimaryPetProfile(user.id);
    redirect(hasPrimary ? "/feed" : "/onboarding/pet");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 blur-[3px]"
        style={{ backgroundImage: "url('/background-image/Pet.png')" }}
      />
      <div className="absolute inset-0 bg-[#edf4e9]/70" />
      <section className="relative z-10 w-full max-w-xl rounded-3xl bg-white/90 p-10 shadow-xl">
        <p className="text-sm font-semibold text-emerald-800">PetSpot</p>
        <h1 className="mt-2 text-4xl font-bold text-zinc-900">
          Social home for dog owners and dog lovers.
        </h1>
        <p className="mt-4 text-zinc-600">
          Build your pet profile, share moments, and connect with your community.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="inline-flex rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Proceed
          </Link>
        </div>
      </section>
    </main>
  );
}
