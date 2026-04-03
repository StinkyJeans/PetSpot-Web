import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset password · PetSpot",
  description: "Request a link to reset your PetSpot password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-center bg-cover scale-105 blur-[3px]"
        style={{ backgroundImage: "url('/background-image/Pet.png')" }}
      />
      <div className="absolute inset-0 bg-[#edf4e9]/70" />
      <ForgotPasswordForm />
    </main>
  );
}
