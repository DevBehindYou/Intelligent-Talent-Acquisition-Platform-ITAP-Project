import AuthLayout from "./AuthLayout.jsx";
import RegisterForm from "../components/RegisterForm.jsx";

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your workspace" subtitle="Set up ITAP for your team in a couple of minutes.">
      <RegisterForm />
    </AuthLayout>
  );
}
