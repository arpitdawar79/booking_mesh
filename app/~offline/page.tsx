import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <WifiOff className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You are offline</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The Stream is ready to resume as soon as your connection returns.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition active:scale-[0.98]"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
