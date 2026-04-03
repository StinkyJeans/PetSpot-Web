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
        encodeURIComponent(
          "This password reset page needs an active reset session. That happens after you open the link from your email. If you already finished resetting your password, sign in below. Otherwise use Forgot password to get a new link.",
        ),
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
