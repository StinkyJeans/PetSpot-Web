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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eef7ef,_#dfeadf)] p-6">
      <section className="w-full max-w-xl rounded-3xl bg-white/90 p-10 shadow-xl">
        <p className="text-sm font-semibold text-emerald-800">PetSpot</p>
        <h1 className="mt-2 text-4xl font-bold text-zinc-900">
          Social home for dog owners and dog lovers.
        </h1>
        <p className="mt-4 text-zinc-600">
          Build your pet profile, share moments, and connect with your community.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}
