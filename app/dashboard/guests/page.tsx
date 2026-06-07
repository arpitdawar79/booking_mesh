"use client";

import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, User, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  idType: string | null;
  idNumber: string | null;
  address: string | null;
  preferences: string | null;
  createdAt: string;
  _count: { bookings: number };
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/guests?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setGuests(data.guests || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Guests
        </h1>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring w-40 sm:w-56"
          />
        </div>
      </div>

      {loading && guests.length === 0 ? (
        <div className="text-muted-foreground">Loading guests...</div>
      ) : guests.length === 0 ? (
        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          No guests found.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {guests.map((g) => (
              <Link
                key={g.id}
                href={`/dashboard/guests/${g.id}`}
                className="block rounded-xl border border-border bg-card/30 p-4 space-y-2 hover:bg-muted/20 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{g.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.phone || g.email || "No contact info"}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={g._count.bookings > 1 ? "confirmed" : "pending"} className="!text-[10px] !px-1.5" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {g._count.bookings} booking{g._count.bookings !== 1 ? "s" : ""}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Bookings</th>
                  <th className="text-left px-4 py-3 font-medium">ID Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {guests.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/guests/${g.id}`} className="font-medium hover:text-teal-400 transition">
                        {g.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{g.email || "—"}</td>
                    <td className="px-4 py-3">{g._count.bookings}</td>
                    <td className="px-4 py-3 text-muted-foreground">{g.idType || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
