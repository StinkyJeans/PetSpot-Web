import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/server";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 blur-[3px]"
        style={{ backgroundImage: "url('/background-image/Pet.png')" }}
      />
      <div className="absolute inset-0 bg-[#edf4e9]/70" />
      <SignupForm />
    </main>
  );
}
