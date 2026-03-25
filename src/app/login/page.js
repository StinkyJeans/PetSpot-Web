import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/server";

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/feed");
  }

  const query = await searchParams;
  const initialError =
    query?.error && typeof query.error === "string" ? query.error : "";
  const initialSuccess =
    query?.success && typeof query.success === "string" ? query.success : "";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 blur-[3px]"
        style={{ backgroundImage: "url('/background-image/Pet.png')" }}
      />
      <div className="absolute inset-0 bg-[#edf4e9]/70" />
      <LoginForm initialError={initialError} initialSuccess={initialSuccess} />
    </main>
  );
}
