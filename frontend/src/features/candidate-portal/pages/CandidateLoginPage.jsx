import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import CandidateAuthLayout from "../layout/CandidateAuthLayout.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { useCandidateAuthViewModel } from "../hooks/useCandidateAuthViewModel.js";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function CandidateLoginPage() {
  const { login, isLoggingIn } = useCandidateAuthViewModel();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <CandidateAuthLayout title="Welcome back" subtitle="Sign in to track your applications.">
      <form onSubmit={handleSubmit(login)} className="flex flex-col gap-md w-full">
        <Input label="Email" type="email" leftIcon="mail" error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          leftIcon="lock"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" size="lg" isLoading={isLoggingIn} className="w-full">
          Sign in
        </Button>
      </form>
      <p className="text-body-sm text-on-surface-variant mt-lg">
        New here?{" "}
        <Link to="/candidate/register" className="text-prussian hover:underline">
          Create a candidate account
        </Link>
      </p>
      <p className="text-body-sm text-on-surface-variant mt-sm">
        Recruiter or HR?{" "}
        <Link to="/login" className="text-prussian hover:underline">
          Sign in to the workspace
        </Link>
      </p>
    </CandidateAuthLayout>
  );
}
