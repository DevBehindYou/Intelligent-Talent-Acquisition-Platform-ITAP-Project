import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { useAuthViewModel } from "../hooks/useAuthViewModel.js";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  organizationName: z.string().min(2, "Enter your organization name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterForm() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || undefined;
  const { signup, isSigningUp } = useAuthViewModel();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <form
      onSubmit={handleSubmit((values) => signup({ ...values, inviteToken }))}
      className="flex flex-col gap-md w-full max-w-sm"
    >
      <Input label="Full name" leftIcon="person" error={errors.fullName?.message} {...register("fullName")} />
      <Input
        label="Organization name"
        leftIcon="business"
        disabled={!!inviteToken}
        error={errors.organizationName?.message}
        {...register("organizationName")}
      />
      <Input label="Work email" type="email" leftIcon="mail" error={errors.email?.message} {...register("email")} />
      <Input
        label="Password"
        type="password"
        leftIcon="lock"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" size="lg" isLoading={isSigningUp} className="w-full">
        Create account
      </Button>
    </form>
  );
}
