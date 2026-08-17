import { useState } from "react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import Input from "./Input.jsx";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  requireTypedName, // when set, user must type this exact string to enable the confirm button
}) {
  const [typed, setTyped] = useState("");
  const disabled = requireTypedName ? typed !== requireTypedName : false;

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone} disabled={disabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-body-md text-on-surface-variant mb-sm">{description}</p>}
      {requireTypedName && (
        <Input
          label={`Type "${requireTypedName}" to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      )}
    </Modal>
  );
}
