import Link from "next/link";

export const metadata = {
  title: "Email confirmed · PetSpot",
  description: "Your email address has been verified.",
};

export default function EmailConfirmedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 blur-[3px]"
        style={{ backgroundImage: "url('/background-image/Pet.png')" }}
      />
      <div className="absolute inset-0 bg-[#edf4e9]/70" />
      <section className="relative z-10 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-8 text-center shadow-2xl">
        <p className="text-sm font-bold text-emerald-800">PetSpot</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">
          Email confirmed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Your email address has been verified successfully. You can sign in with your
          account.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#184f24] px-5 py-3 text-sm font-semibold text-white hover:bg-[#123f1d]"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
