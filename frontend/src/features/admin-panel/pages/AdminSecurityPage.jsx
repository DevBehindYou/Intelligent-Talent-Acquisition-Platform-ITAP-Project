import { useState } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Input from "../../../shared/components/Input.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { useAdminMfaViewModel } from "../hooks/useAdminMfaViewModel.js";

export default function AdminSecurityPage() {
  const { mfaEnabled, setup, startSetup, isStarting, enable, isEnabling, disable, isDisabling } =
    useAdminMfaViewModel();
  const [enableCode, setEnableCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Security" subtitle="Two-factor authentication for your admin account." />

      <div className="rounded-xl border border-outline-variant/40 bg-paper p-lg">
        <div className="flex items-center justify-between gap-md mb-md">
          <div className="flex items-center gap-sm">
            <Icon name="encrypted" className="text-on-surface-variant" />
            <h2 className="font-display-sm text-display-sm text-on-surface">Authenticator app (TOTP)</h2>
          </div>
          {mfaEnabled ? <Badge tone="success">Enabled</Badge> : <Badge tone="warning">Not set up</Badge>}
        </div>

        {mfaEnabled ? (
          <div className="flex flex-col gap-md">
            <p className="text-body-md text-on-surface-variant">
              Two-factor authentication is protecting this account. To turn it off, confirm with a current code.
            </p>
            <div className="flex items-end gap-sm">
              <div className="flex-1 max-w-[200px]">
                <Input label="Current code" leftIcon="pin" inputMode="numeric" placeholder="123456" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} />
              </div>
              <Button variant="danger" isLoading={isDisabling} disabled={disableCode.trim().length < 6} onClick={() => disable(disableCode.trim())}>
                Disable
              </Button>
            </div>
          </div>
        ) : setup ? (
          <div className="flex flex-col gap-md">
            <p className="text-body-md text-on-surface-variant">
              Scan this QR code with your authenticator app (or enter the key manually), then enter a code to confirm.
            </p>
            <div className="flex flex-col sm:flex-row gap-lg items-start">
              <img src={setup.qrDataUrl} alt="MFA QR code" className="w-40 h-40 rounded border border-outline-variant/40" />
              <div className="flex-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs">Manual key</p>
                <code className="block text-body-sm bg-surface-container-high rounded p-sm break-all text-on-surface">
                  {setup.secret}
                </code>
              </div>
            </div>
            <div className="flex items-end gap-sm">
              <div className="flex-1 max-w-[200px]">
                <Input label="Enter code to confirm" leftIcon="pin" inputMode="numeric" placeholder="123456" value={enableCode} onChange={(e) => setEnableCode(e.target.value)} />
              </div>
              <Button isLoading={isEnabling} disabled={enableCode.trim().length < 6} onClick={() => enable(enableCode.trim())}>
                Enable
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            <p className="text-body-md text-on-surface-variant">
              Add a second factor so a password alone can&rsquo;t access the platform admin panel.
            </p>
            <Button leftIcon="add_moderator" isLoading={isStarting} onClick={() => startSetup()} className="w-fit">
              Set up two-factor authentication
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
