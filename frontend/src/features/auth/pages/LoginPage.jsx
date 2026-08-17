import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import LoginForm from "../components/LoginForm.jsx";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your ITAP workspace.">
      <LoginForm />
      <p className="text-body-sm text-on-surface-variant mt-lg">
        Need an account?{" "}
        <Link to="/register" className="text-prussian hover:underline">
          Contact your HR admin for an invite
        </Link>
      </p>
    </AuthLayout>
  );
}
