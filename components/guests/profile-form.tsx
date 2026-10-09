"use client";
import { useState } from "react";
import type { Profile } from "./types";
import { guestApi, inputClass, buttonClass, primaryClass, Notice } from "./ui";
export function ProfileForm({
  guest,
  onSaved,
  onCancel,
}: {
  guest?: Profile;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: guest?.name || "",
    phone: guest?.phone || "",
    email: guest?.email || "",
    city: guest?.city || "",
    birthday: guest?.birthday?.slice(0, 10) || "",
    address: guest?.address || "",
    idType: guest?.idType || "",
    idNumber: guest?.idNumber || "",
    preferences: guest?.preferences || "",
    notes: guest?.notes || "",
    tags: guest?.tags.join(", ") || "",
    whatsappConsent: guest?.whatsappConsent || false,
    emailConsent: guest?.emailConsent || false,
    doNotContact: guest?.doNotContact || false,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await guestApi(
        "/api/guests",
        {
          ...form,
          ...(guest ? { id: guest.id } : {}),
          phone: form.phone || null,
          email: form.email || null,
          birthday: form.birthday || null,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        guest ? "PATCH" : "POST",
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["name", "Full name", "text"],
            ["phone", "Phone", "tel"],
            ["email", "Email", "email"],
            ["city", "City", "text"],
            ["birthday", "Birthday", "date"],
            ["tags", "Tags (comma separated)", "text"],
            ["address", "Address", "text"],
            ["idType", "ID type", "text"],
            ["idNumber", "ID number", "text"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="block text-sm font-medium">
            {label}
            {key === "name" ? " *" : ""}
            <input
              className={inputClass + " mt-1.5"}
              type={type}
              value={form[key]}
              required={key === "name"}
              maxLength={key === "name" ? 120 : 1000}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["preferences", "Stay preferences"],
            ["notes", "Internal notes"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm font-medium">
            {label}
            <textarea
              rows={3}
              className={inputClass + " mt-1.5"}
              value={form[key]}
              maxLength={key === "notes" ? 5000 : 3000}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">
          Communication preferences
        </legend>
        {(
          [
            ["whatsappConsent", "Guest agreed to WhatsApp marketing"],
            ["emailConsent", "Guest agreed to email marketing"],
            ["doNotContact", "Do not contact for marketing"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.checked }))
              }
            />
            {label}
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Only record consent the guest has given. Booking messages use separate
          delivery rules.
        </p>
      </fieldset>
      {error && <Notice message={error} error />}
      <div className="flex gap-2">
        <button disabled={busy} className={primaryClass}>
          {busy ? "Saving…" : "Save profile"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}
