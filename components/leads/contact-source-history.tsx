"use client";

import { useEffect, useState } from "react";

interface ImportSnapshot {
  id: string;
  createdAt: string;
  importedBy?: {name: string} | null;
  metadata: {
    method?: string;
    files?: {name: string; format: string}[];
    device?: {installationId?: string; timezone?: string; language?: string; displayMode?: string} | null;
    browser?: {userAgent?: string | null; platform?: string | null};
    network?: {ip?: string | null; trust?: string};
  };
}

export function ContactSourceHistory({leadId, source}: {leadId: string; source: string}) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [imports, setImports] = useState<ImportSnapshot[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/leads/${encodeURIComponent(leadId)}/imports?page=${page}`, {signal: controller.signal})
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load source history");
        if (!Array.isArray(data.imports)) throw new Error("Could not read source history");
        if (controller.signal.aborted) return;
        setImports(data.imports);
        setHasMore(data.hasMore === true);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load source history");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [expanded, leadId, page, retry]);

  return (
    <details className="mt-2 text-xs" onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary className="cursor-pointer py-2 text-muted-foreground">Source: {source.replaceAll("_", " ")} · View import history</summary>
      {loading ? <p role="status" className="py-2">Loading source history…</p> : error ? (
        <div role="alert"><p>{error}</p><button className="underline py-2" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>
      ) : !imports.length ? <p className="py-2 text-muted-foreground">No phone-import history recorded. Older contacts and other capture channels retain their source shown above.</p> : (
        <div className="space-y-3 pt-2">
          {imports.map((snapshot) => (
            <div key={snapshot.id} className="rounded-lg border border-border p-3 space-y-1 break-words">
              <p className="font-semibold">{snapshot.metadata.method === "phone_picker" ? "Phone contact picker" : snapshot.metadata.method === "contact_file" ? "Contact file upload" : "Contact import"}</p>
              <p>{new Date(snapshot.createdAt).toLocaleString()} · {snapshot.importedBy?.name || "Unavailable uploader"}</p>
              {!!snapshot.metadata.files?.length && <p>Files: {snapshot.metadata.files.map((file) => file.name).join(", ")}</p>}
              <p>Browser ID: <span className="font-mono">{snapshot.metadata.device?.installationId || "Unavailable"}</span></p>
              <p>IP: {snapshot.metadata.network?.ip || "Unavailable"}{snapshot.metadata.network?.ip && ` (${snapshot.metadata.network.trust === "configured_proxy_header" ? "configured proxy" : "unverified header"})`}</p>
              {snapshot.metadata.device?.timezone && <p>Timezone: {snapshot.metadata.device.timezone}</p>}
              {snapshot.metadata.browser?.userAgent && <p className="text-muted-foreground">Browser: {snapshot.metadata.browser.userAgent}</p>}
            </div>
          ))}
        </div>
      )}
      {(page > 1 || hasMore) && !loading && !error && <div className="flex items-center gap-3 pt-2">
        <button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="py-2 underline disabled:opacity-50">Newer</button>
        <span>Page {page}</span>
        <button disabled={!hasMore} onClick={() => setPage((value) => value + 1)} className="py-2 underline disabled:opacity-50">Older</button>
      </div>}
    </details>
  );
}
