import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import Avatar from "../../../shared/components/Avatar.jsx";
import { useAuthViewModel } from "../hooks/useAuthViewModel.js";

export default function ProfileSettingsPage() {
  const { user } = useAuthViewModel();
  const [fullName, setFullName] = useState(user?.fullName || "");

  return (
    <div>
      <PageHeader title="Profile settings" subtitle="Your name, avatar, and account details." />
      <div className="max-w-md rounded-xl border border-outline-variant/40 bg-paper p-md flex flex-col gap-md">
        <div className="flex items-center gap-sm">
          <Avatar name={user?.fullName} src={user?.avatarUrl} size={56} />
          <Button variant="secondary" size="sm">
            Change photo
          </Button>
        </div>
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email" value={user?.email || ""} disabled hint="Contact your HR admin to change your email." />
        <Input label="Role" value={(user?.role || "").replace("_", " ")} disabled />
        <Button className="self-start">Save changes</Button>
      </div>
    </div>
  );
}
