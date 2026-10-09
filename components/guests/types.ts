import type { GuestProgram, NextAction } from "@/lib/guests/core";
export interface Stats {
  totalStays: number;
  totalNights: number;
  totalRevenue: number;
  netRevenue: number;
  avgStayLength: number;
  preferredRoomType: string | null;
  lastStay: string | null;
  firstStay: string | null;
  daysSinceLastStay: number | null;
  upcomingStays: number;
  lifecycle: string;
  otherCurrencies: string[];
}
export interface GuestSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  tags: string[];
  birthday: string | null;
  referralCode: string;
  stats: Stats;
  tier: { name: string; percent: number };
  wallet: number;
  expiringPoints: number;
  openFeedback: number;
  actions: NextAction[];
  segments: string[];
  marketingEligible: boolean;
  exclusionReason: string | null;
  _count: { bookings: number };
}
export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  idType: string | null;
  idNumber: string | null;
  address: string | null;
  preferences: string | null;
  notes: string | null;
  city: string | null;
  birthday: string | null;
  tags: string[];
  whatsappConsent: boolean;
  emailConsent: boolean;
  doNotContact: boolean;
  referralCode: string;
  contacts: { id: string; kind: string; value: string }[];
  activities: {
    id: string;
    kind: string;
    summary: string;
    createdAt: string;
  }[];
  feedback: Feedback[];
  referrals: {
    id: string;
    status: string;
    awardedPoints: number;
    createdAt: string;
    referredGuest: { id: string; name: string };
  }[];
  referredBy: { referrer: { id: string; name: string }; status: string } | null;
  redemptions: {
    id: string;
    bookingId: string;
    amount: string;
    points: number;
    reversedAt: string | null;
  }[];
}
export interface Booking {
  id: string;
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  roomType: string;
  totalAmount: string;
  balanceAmount: string;
  currency: string;
  status: string;
  payments: {
    id: string;
    amount: string;
    isRefund: boolean;
    method: string;
    date: string;
  }[];
}
export interface Feedback {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  followUp: boolean;
  status: string;
  resolution: string | null;
  createdAt: string;
}
export interface Reward {
  id: string;
  points: number;
  kind: string;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
}
export interface Offer {
  id: string;
  code: string;
  name: string;
  percent: number;
  maxAmount: string;
  minAmount: string;
  minStays: number;
  startsAt: string;
  expiresAt: string;
  maxUses: number;
  enabled: boolean;
}
export interface Detail {
  guest: Profile;
  stats: Stats;
  bookings: Booking[];
  tier: { name: string; percent: number };
  wallet: number;
  ledger: Reward[];
  program: GuestProgram;
  offers: Offer[];
  actions: NextAction[];
  expiringPoints: number;
  marketingEligible: boolean;
  exclusionReason: string | null;
  canManage: boolean;
  mergedIntoId?: string;
}
