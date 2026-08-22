import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { useAuthViewModel } from "../hooks/useAuthViewModel.js";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginForm() {
  const { login, isLoggingIn } = useAuthViewModel();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "demo@itap.com",
      password: "demo@1234",
    },
  });

  return (
    <form onSubmit={handleSubmit(login)} className="flex flex-col gap-md w-full max-w-sm">
      <div className="bg-surface-variant text-on-surface-variant p-md rounded-md text-body-sm text-center mb-sm">
        <strong>Demo credentials pre-filled!</strong>
        <br />
        Just click &ldquo;Sign in&rdquo; below.
      </div>
      <Input label="Email" type="email" leftIcon="mail" error={errors.email?.message} {...register("email")} />
      <Input
        label="Password"
        type="password"
        leftIcon="lock"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="flex justify-end -mt-2">
        <Link to="/forgot-password" className="text-body-sm text-prussian hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" isLoading={isLoggingIn} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
