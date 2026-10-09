import { normalizeContactPhone } from "../phone-normalize";
type SearchProfile = {
  name: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  tags: string[];
  preferences?: string | null;
  notes?: string | null;
  contacts: { kind: string; value: string }[];
  leads: { source: string; sourceGroupName?: string | null }[];
};
const fold = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replaceAll("_", " ");
export function matchesDiscovery(guest: SearchProfile, search: string) {
  const q = search.trim();
  if (!q) return true;
  if (/^[+\d()\s.-]+$/.test(q) && q.replace(/\D/g, "").length >= 7) {
    const digits = normalizeContactPhone(q) || q.replace(/\D/g, "");
    return [
      guest.phone,
      ...guest.contacts.filter((c) => c.kind === "phone").map((c) => c.value),
    ].some(
      (p) =>
        p &&
        (normalizeContactPhone(p) || p.replace(/\D/g, "")).includes(digits),
    );
  }
  const text = fold(
    [
      guest.name,
      guest.phone,
      guest.email,
      guest.city,
      guest.preferences,
      guest.notes,
      ...guest.tags,
      ...guest.contacts.map((c) => c.value),
      ...guest.leads.flatMap((l) => [l.source, l.sourceGroupName]),
    ]
      .filter(Boolean)
      .join(" "),
  );
  return fold(q)
    .split(/\s+/)
    .every((word) => text.includes(word));
}
export function discoverySegments(g: {
  phone: string | null;
  email: string | null;
  city: string | null;
  preferences: string | null;
  expiringPoints: number;
  marketingEligible: boolean;
}) {
  return [
    ...(g.expiringPoints > 0 ? ["expiring_rewards"] : []),
    ...(!g.city || !g.preferences || (!g.phone && !g.email)
      ? ["profile_incomplete"]
      : []),
    ...(g.marketingEligible ? ["ready_to_contact"] : []),
  ];
}
export const discoverySorts = [
  "updated",
  "priority",
  "value",
  "recent_stay",
  "points",
  "name",
] as const;
type Sortable = {
  id: string;
  name: string;
  stats: { netRevenue: number; lastStay: Date | string | null };
  actions: { priority: number }[];
  wallet: number;
};
export function sortGuests<T extends Sortable>(guests: T[], sort: string): T[] {
  if (sort === "updated") return guests;
  const rank = (g: T) =>
    sort === "priority"
      ? Math.max(0, ...g.actions.map((a) => a.priority))
      : sort === "value"
        ? g.stats.netRevenue
        : sort === "points"
          ? g.wallet
          : g.stats.lastStay
            ? new Date(g.stats.lastStay).getTime()
            : 0;
  return [...guests].sort(
    (a, b) =>
      (sort === "name" ? 0 : rank(b) - rank(a)) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
}
