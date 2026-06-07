"use client";

import { useState } from "react";

export default function TemplatesPage() {
  const [type, setType] = useState("booking_confirmation");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    const res = await fetch("/api/preview-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: "preview",
        type,
      }),
    });
    const html = await res.text();
    setPreviewHtml(html);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl sm:text-2xl font-bold">Email Templates</h1>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
        >
          <option value="booking_confirmation">Booking Confirmation</option>
          <option value="cancellation">Cancellation</option>
          <option value="notification">Notification</option>
          <option value="thank_you">Thank You</option>
        </select>
        <button
          onClick={handlePreview}
          disabled={loading}
          className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition"
        >
          {loading ? "Loading..." : "Preview"}
        </button>
      </div>

      {previewHtml && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
            Preview
          </div>
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[50vh] sm:h-[600px] bg-white"
            title="Email preview"
          />
        </div>
      )}
    </div>
  );
}
