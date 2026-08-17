import AuthLayout from "./AuthLayout.jsx";
import ForgotPasswordForm from "../components/ForgotPasswordForm.jsx";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a secure reset link.">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
