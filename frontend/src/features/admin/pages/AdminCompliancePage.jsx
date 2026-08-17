import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";

export default function AdminCompliancePage() {
  const [retentionDays, setRetentionDays] = useState(365);

  return (
    <div>
      <PageHeader title="Data & compliance" subtitle="Retention window and candidate consent settings (docs/04-auth-security.md §5)." />
      <div className="max-w-md rounded-xl border border-outline-variant/40 bg-paper p-md flex flex-col gap-md">
        <Input
          label="Candidate data retention (days)"
          type="number"
          value={retentionDays}
          onChange={(e) => setRetentionDays(Number(e.target.value))}
          hint="Candidate PII is anonymized automatically after this window."
        />
        <Button className="self-start">Save</Button>
      </div>
    </div>
  );
}
