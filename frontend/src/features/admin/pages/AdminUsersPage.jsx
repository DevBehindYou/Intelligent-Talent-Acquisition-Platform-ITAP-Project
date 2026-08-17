import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import Modal from "../../../shared/components/Modal.jsx";
import Input from "../../../shared/components/Input.jsx";
import Select from "../../../shared/components/Select.jsx";
import Avatar from "../../../shared/components/Avatar.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import { SkeletonTable } from "../../../shared/components/Skeleton.jsx";
import { useAdminUsersViewModel } from "../hooks/useAdminUsersViewModel.js";

const ROLES = [
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "hr_admin", label: "HR Admin" },
];

export default function AdminUsersPage() {
  const { users, isLoading, invite, isInviting, updateRole } = useAdminUsersViewModel();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "recruiter" });

  return (
    <div>
      <PageHeader
        title="User management"
        subtitle="Invite recruiters and hiring managers, and manage roles."
        actions={<Button leftIcon="person_add" onClick={() => setIsInviteOpen(true)}>Invite user</Button>}
      />

      {isLoading ? (
        <SkeletonTable />
      ) : (
        <div className="rounded-xl border border-outline-variant/40 bg-paper divide-y divide-outline-variant/20">
          {users.map((u) => (
            <div key={u._id} className="flex items-center gap-sm px-md py-sm">
              <Avatar name={u.fullName} size={32} />
              <div className="flex-1">
                <p className="text-body-md text-on-surface">{u.fullName}</p>
                <p className="text-body-sm text-on-surface-variant">{u.email}</p>
              </div>
              <Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Active" : "Inactive"}</Badge>
              <Select
                value={u.role}
                options={ROLES}
                onChange={(e) => updateRole({ userId: u._id, role: e.target.value })}
                className="!w-40"
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Invite a teammate"
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        footer={
          <Button isLoading={isInviting} onClick={() => (invite(form), setIsInviteOpen(false))}>
            Send invite
          </Button>
        }
      >
        <div className="flex flex-col gap-md">
          <Input label="Work email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Select label="Role" options={ROLES} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
