import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import CandidateAuthLayout from "../layout/CandidateAuthLayout.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { useCandidateAuthViewModel } from "../hooks/useCandidateAuthViewModel.js";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export default function CandidateRegisterPage() {
  const { signup, isSigningUp } = useCandidateAuthViewModel();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <CandidateAuthLayout title="Create your account" subtitle="Build one profile, apply to many roles.">
      <form onSubmit={handleSubmit(signup)} className="flex flex-col gap-md w-full">
        <Input label="Full name" leftIcon="person" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" leftIcon="mail" error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          leftIcon="lock"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" size="lg" isLoading={isSigningUp} className="w-full">
          Create account
        </Button>
      </form>
      <p className="text-body-sm text-on-surface-variant mt-lg">
        Already have an account?{" "}
        <Link to="/candidate/login" className="text-prussian hover:underline">
          Sign in
        </Link>
      </p>
    </CandidateAuthLayout>
  );
}
