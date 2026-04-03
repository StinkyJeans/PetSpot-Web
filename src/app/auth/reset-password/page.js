import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata = {
  title: "Set new password · PetSpot",
  description: "Choose a new password for your PetSpot account.",
};

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Reset link is invalid or expired. Request a new one from Forgot password."),
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 blur-[3px]"
        style={{ backgroundImage: "url('/background-image/Pet.png')" }}
      />
      <div className="absolute inset-0 bg-[#edf4e9]/70" />
      <ResetPasswordForm />
    </main>
  );
}
