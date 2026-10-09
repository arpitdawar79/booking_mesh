"use client";

import { parseContactsCsv, parseVcf, type ParsedContact } from "@/lib/contact-file-parsers";
import { pickPhoneContacts, prepareContacts, type ImportContact } from "@/lib/contact-import";
import { captureImportDevice } from "@/lib/contact-import-device";
import type { ImportContext } from "@/lib/contact-import-context";
import { cn } from "@/lib/utils";
import { CheckCircle2, FileUp, Loader2, Smartphone, Upload, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ImportResult {
  received: number;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
}

type Step = "choose" | "preview" | "importing" | "done";
const UPLOAD_CHUNK = 500;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const emptyResult = (): ImportResult => ({ received: 0, created: 0, updated: 0, skipped: 0, invalid: 0 });

export function PhoneContactImport({ open, onClose, onImported }: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const [parsed, setParsed] = useState<ImportContact[]>([]);
  const [selected, setSelected] = useState(new Set<string>());
  const [search, setSearch] = useState("");
  const [droppedInvalid, setDroppedInvalid] = useState(0);
  const [droppedDuplicates, setDroppedDuplicates] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickerSupported, setPickerSupported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const operationRef = useRef(false);
  const queueRef = useRef<ImportContact[]>([]);
  const sourceRef = useRef<Pick<ImportContext, "method" | "files">>({method: "phone_picker"});
  const contextRef = useRef<ImportContext | null>(null);
  const completedRef = useRef(0);
  const totalsRef = useRef(emptyResult());

  useEffect(() => {
    setPickerSupported(window.isSecureContext && window.top === window.self &&
      typeof navigator.contacts?.select === "function");
    const dialog = dialogRef.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  const showPreview = (raw: ParsedContact[]) => {
    const { contacts, invalid, duplicates } = prepareContacts(raw);
    setParsed(contacts);
    setSelected(new Set(contacts.map((contact) => contact.phone)));
    setDroppedInvalid(invalid);
    setDroppedDuplicates(duplicates);
    setSearch("");
    setError(contacts.length ? null : "No usable phone numbers found. Try another selection or contacts export.");
    setStep(contacts.length ? "preview" : "choose");
  };

  const handlePick = async () => {
    if (!navigator.contacts || operationRef.current) return;
    operationRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const records = await pickPhoneContacts(navigator.contacts);
      if (records.length) {
        sourceRef.current = {method: "phone_picker"};
        showPreview(records);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("Could not open phone contacts. Allow contact selection in your browser or upload a VCF/CSV export instead.");
      }
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (operationRef.current || !files.length) return;
    operationRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (files.length > 100) throw new Error("Choose up to 100 export files per import.");
      if (files.reduce((sum, file) => sum + file.size, 0) > MAX_FILE_BYTES) {
        throw new Error("Choose exports totalling 20 MB or less. Import larger exports separately.");
      }
      let contacts: ParsedContact[] = [];
      for (const file of files) {
        if (!/\.(vcf|csv)$/i.test(file.name)) throw new Error("Choose .vcf or .csv contacts exports.");
        const text = await file.text();
        contacts = contacts.concat(/\.vcf$/i.test(file.name) ? parseVcf(text) : parseContactsCsv(text));
      }
      sourceRef.current = {method: "contact_file", files: files.map((file) => ({
        name: file.name.slice(0, 255), format: /\.vcf$/i.test(file.name) ? "vcf" : "csv", bytes: file.size,
      }))};
      showPreview(contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the contacts export.");
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (operationRef.current || !selected.size) return;
    operationRef.current = true;
    setBusy(true);
    if (!queueRef.current.length) queueRef.current = parsed.filter((contact) => selected.has(contact.phone));
    const queue = queueRef.current;
    setStep("importing");
    setError(null);
    try {
      contextRef.current ??= {id: crypto.randomUUID(), ...sourceRef.current, device: captureImportDevice()};
      while (completedRef.current < queue.length) {
        const chunk = queue.slice(completedRef.current, completedRef.current + UPLOAD_CHUNK);
        const res = await fetch("/api/leads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts: chunk, importContext: contextRef.current }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `Import failed (${res.status})`);
        for (const key of Object.keys(totalsRef.current) as (keyof ImportResult)[]) {
          if (typeof data[key] !== "number" || !Number.isFinite(data[key]) || data[key] < 0) {
            throw new Error("Unexpected server response. Retry the import.");
          }
        }
        for (const key of Object.keys(totalsRef.current) as (keyof ImportResult)[]) totalsRef.current[key] += data[key];
        completedRef.current += chunk.length;
        setProgress(Math.round((completedRef.current / queue.length) * 100));
      }
      setResult({ ...totalsRef.current });
      setStep("done");
      onImported();
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Import failed."} ${completedRef.current} of ${queue.length} numbers processed. Retry to continue; existing leads are deduplicated.`);
      setStep("preview");
      if (completedRef.current) onImported();
    } finally {
      operationRef.current = false;
      setBusy(false);
    }
  };

  const reset = () => {
    setStep("choose");
    setParsed([]);
    setSelected(new Set());
    setResult(null);
    setProgress(0);
    setError(null);
    queueRef.current = [];
    contextRef.current = null;
    completedRef.current = 0;
    totalsRef.current = emptyResult();
  };

  const close = () => {
    if (operationRef.current) return;
    reset();
    onClose();
  };

  const filtered = parsed.filter((contact) => `${contact.name ?? ""} ${contact.phone}`.toLowerCase().includes(search.toLowerCase()));
  const locked = queueRef.current.length > 0;

  return (
    <dialog ref={dialogRef} aria-labelledby="phone-contact-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl backdrop:bg-black/60 max-h-[85dvh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 id="phone-contact-title" className="font-bold text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Import phone contacts
        </h2>
        <button onClick={close} disabled={busy} aria-label="Close contact import"
          className="p-3 rounded-lg hover:bg-muted/50 disabled:opacity-50">
          <X className="w-4 h-4" />
        </button>
      </div>

      {step === "choose" && (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Import a complete address-book export, or choose contacts directly on a supported phone.</p>
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
            <FileUp className="w-4 h-4" /> Upload all contacts (.vcf / .csv)
          </button>
          {pickerSupported ? (
            <button onClick={handlePick} disabled={busy}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/40 border border-border font-semibold disabled:opacity-50">
              <Smartphone className="w-4 h-4 text-primary" /> Choose phone contacts
            </button>
          ) : (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">Direct contact selection is unavailable here. Use a VCF/CSV export on iPhone, desktop, or an unsupported browser.</p>
          )}
          <p className="text-xs text-muted-foreground">The phone picker shares only contacts you select. To include the whole address book, export all contacts and upload the file.</p>
          <details className="rounded-lg border border-border p-3 text-xs">
            <summary className="cursor-pointer font-semibold">How to export all contacts</summary>
            <ul className="mt-2 space-y-2 list-disc pl-4 text-muted-foreground">
              <li>Android: open Contacts, find Export in settings or Manage contacts, choose all contacts, and save a VCF file.</li>
              <li>iPhone: open Contacts → Lists, touch and hold a list → Export, choose fields, and save to Files. Export other lists too if needed.</li>
              <li>Google Contacts: select all contacts → Export → Google CSV or vCard.</li>
            </ul>
            <p className="mt-2">Choose multiple export files together. Maximum combined size: 20 MB.</p>
          </details>
          <p className="text-xs text-muted-foreground">You will review the contacts before saving them to this workspace&apos;s leads. Import only contacts you have permission to share. Importing does not grant permission to send marketing messages. We also save the import source, uploading browser identifier, browser details, and available network IP for source history.</p>
          {busy && <p role="status" className="flex gap-2 items-center"><Loader2 className="w-4 h-4 animate-spin" /> Reading contacts…</p>}
        </div>
      )}
      <input ref={fileRef} type="file" multiple accept=".vcf,.csv,text/vcard,text/x-vcard,text/csv"
        aria-label="Upload contact export files" className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void handleFiles(files);
        }} />

      {step === "preview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Ready numbers" value={parsed.length} accent />
            <Stat label="Duplicates merged" value={droppedDuplicates} />
            <Stat label="Invalid numbers" value={droppedInvalid} />
          </div>
          <p className="text-xs text-muted-foreground">All usable numbers are selected, including alternate phone numbers. Names and valid emails are included. Bare Indian mobile numbers use country code +91.</p>
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search imported contacts"
            placeholder="Search name or phone" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm py-2">
            <input type="checkbox" disabled={locked} checked={selected.size === parsed.length}
              onChange={(event) => setSelected(new Set(event.target.checked ? parsed.map((contact) => contact.phone) : []))} />
            Select all {parsed.length} numbers ({selected.size} selected)
          </label>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
            {filtered.slice(0, 100).map((contact) => (
              <label key={contact.phone} className="flex items-center gap-3 px-3 py-3 text-xs">
                <input type="checkbox" disabled={locked} checked={selected.has(contact.phone)}
                  onChange={(event) => setSelected((previous) => {
                    const next = new Set(previous);
                    if (event.target.checked) next.add(contact.phone); else next.delete(contact.phone);
                    return next;
                  })} />
                <span className="font-semibold truncate flex-1">{contact.name || "Unnamed contact"}</span>
                <span className="text-muted-foreground font-mono">+{contact.phone}</span>
              </label>
            ))}
            {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No matching contacts.</p>}
          </div>
          {filtered.length > 100 && <p className="text-xs text-muted-foreground">Showing 100 of {filtered.length} matching numbers. Search to review others; all selected numbers will be imported.</p>}
          <button onClick={runImport} disabled={!selected.size || busy}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            <Upload className="w-4 h-4" /> {locked ? "Retry remaining contacts" : `Import ${selected.size} numbers`}
          </button>
          {!locked && <button onClick={reset} className="w-full py-3 text-sm underline">Choose another file or selection</button>}
        </div>
      )}

      {step === "importing" && (
        <div className="py-6 space-y-3" role="status" aria-live="polite">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold"><Loader2 className="w-4 h-4 animate-spin" /> Importing… {progress}%</p>
          <progress className="w-full h-3 accent-primary" value={progress} max={100} aria-label="Contact import progress" />
          <p className="text-xs text-muted-foreground text-center">Keep this window open until the import finishes.</p>
        </div>
      )}

      {step === "done" && result && (
        <div className="py-4 space-y-3" role="status">
          <p className="flex items-center justify-center gap-2 text-sm font-bold"><CheckCircle2 className="w-5 h-5 text-primary" /> Import complete</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="New leads" value={result.created} accent />
            <Stat label="Enriched" value={result.updated} />
            <Stat label="Already had" value={result.skipped} />
          </div>
          {result.invalid > 0 && <p className="text-xs text-muted-foreground">{result.invalid} numbers rejected by the server.</p>}
          <button onClick={close} className="w-full px-3 py-3 rounded-xl bg-muted/40 border border-border text-sm font-semibold">Done</button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
    </dialog>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-2 py-2.5">
      <div className={cn("text-base font-bold", accent ? "text-primary" : "text-foreground")}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
