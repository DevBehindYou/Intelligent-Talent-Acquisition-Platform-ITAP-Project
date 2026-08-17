import { useState } from "react";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import { authApi } from "../services/authApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pushToast = useNotificationsStore((s) => s.pushToast);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      pushToast({ tone: "danger", message: "Couldn't send reset email. Try again." });
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return <p className="text-body-md text-on-surface-variant max-w-sm">Check {email} for a reset link.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md w-full max-w-sm">
      <Input label="Work email" type="email" leftIcon="mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
