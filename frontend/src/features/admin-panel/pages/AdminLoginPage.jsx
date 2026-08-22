import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useAdminAuthViewModel } from "../hooks/useAdminAuthViewModel.js";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AdminLoginPage() {
  const { login, isLoggingIn, mfaPending, submitMfa, isVerifyingMfa } = useAdminAuthViewModel();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-lg">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-sm mb-lg text-white">
          <Icon name="shield_person" className="text-secondary-fixed-dim" size={28} />
          <span className="font-display-md text-display-md">Platform Admin</span>
        </div>
        <div className="bg-paper rounded-xl p-lg shadow-md">
          {mfaPending ? (
            <>
              <h1 className="font-display-lg text-display-lg text-on-surface mb-1">Two-factor code</h1>
              <p className="text-body-sm text-on-surface-variant mb-lg">
                Enter the 6-digit code from your authenticator app.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitMfa(code.trim());
                }}
                className="flex flex-col gap-md"
              >
                <Input
                  label="Authentication code"
                  leftIcon="pin"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button type="submit" size="lg" isLoading={isVerifyingMfa} disabled={code.trim().length < 6} className="w-full">
                  Verify
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display-lg text-display-lg text-on-surface mb-1">Restricted access</h1>
              <p className="text-body-sm text-on-surface-variant mb-lg">
                Authorized platform administrators only. All access is logged.
              </p>
              <form onSubmit={handleSubmit(login)} className="flex flex-col gap-md">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
