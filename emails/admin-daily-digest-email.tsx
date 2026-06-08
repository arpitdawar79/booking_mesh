import React from "react";
import {
  EmailShell,
  EmailFooter,
  EmailSection,
  themes,
} from "./components";

interface BookingItem {
  bookingId: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  nightCount: number;
  roomCount: number;
  roomType: string;
  mealPlan: string;
  adultCount: number;
  childCount: number;
  caretakerNumber: string;
  specialRequests: string;
  balanceAmount: number;
  paymentStatus: string;
  currency: string;
  googleReviewUrl?: string;
  instagramUrl?: string;
}

interface Props {
  date: string;
  checkIns: BookingItem[];
  checkOuts: BookingItem[];
}

export function AdminDailyDigestEmail(props: Props) {
  const theme = themes.admin;

  return (
    <EmailShell theme={theme} title="Daily Digest | The Stream by Ekantah">
      {/* Header */}
      <tr>
        <td style={{ background: theme.heroBg, padding: "28px 36px 24px" }}>
          <div style={{ color: theme.heroTagline, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, lineHeight: "15px", textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: "bold" }}>
            Daily Digest
          </div>
          <div style={{ color: theme.heroHeadline, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 28, lineHeight: "36px", fontWeight: "normal", paddingTop: 8 }}>
            The Stream by Ekantah
          </div>
          <div style={{ color: theme.heroBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "22px", paddingTop: 6 }}>
            {props.date}
          </div>
          <div style={{ color: "#8a9bb5", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 13, lineHeight: "18px", paddingTop: 8, fontStyle: "italic" }}>
            Where the river meets the mountains.
          </div>
        </td>
      </tr>

      {/* Check-ins */}
      <EmailSection theme={theme} label="Arriving Today" title="Guests checking in">
        {props.checkIns.length === 0 ? (
          <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px", paddingTop: 14 }}>
            No check-ins scheduled for today.
          </div>
        ) : (
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ paddingTop: 14 }}>
            {props.checkIns.map((b) => (
              <BookingRow key={b.bookingId} booking={b} isCheckOut={false} />
            ))}
          </table>
        )}
      </EmailSection>

      {/* Check-outs */}
      <EmailSection theme={theme} label="Departing Today" title="Guests checking out">
        {props.checkOuts.length === 0 ? (
          <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px", paddingTop: 14 }}>
            No check-outs scheduled for today.
          </div>
        ) : (
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ paddingTop: 14 }}>
            {props.checkOuts.map((b) => (
              <BookingRow key={b.bookingId} booking={b} isCheckOut={true} />
            ))}
          </table>
        )}
      </EmailSection>

      <EmailFooter theme={theme} />
    </EmailShell>
  );
}

function BookingRow({
  booking,
  isCheckOut,
}: {
  booking: BookingItem;
  isCheckOut?: boolean;
}) {
  return (
    <tr>
      <td style={{ paddingBottom: 16, borderBottom: "1px solid #e0e0e0" }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ paddingTop: 12 }}>
          <tr>
            <td>
              <div style={{ color: "#181d3b", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "21px", fontWeight: "bold" }}>
                {booking.guestFullName}
              </div>
              <div style={{ color: "#465149", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "20px", paddingTop: 2 }}>
                {booking.guestEmail} &middot; {booking.guestPhone || "—"}
              </div>
              <div style={{ color: "#465149", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "20px", paddingTop: 2 }}>
                {booking.roomCount}x {booking.roomType} &middot; {booking.adultCount} adults
                {booking.childCount > 0 ? `, ${booking.childCount} children` : ""}{" "}
                &middot; {booking.nightCount} night{booking.nightCount > 1 ? "s" : ""} &middot; Meals: {booking.mealPlan}
              </div>
              <div style={{ color: "#7b8175", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px", paddingTop: 2 }}>
                {booking.checkInDate} {booking.checkInTime} &rarr; {booking.checkOutDate} {booking.checkOutTime} &middot; ID: {booking.bookingId}
              </div>
              {booking.specialRequests && booking.specialRequests !== "None shared." && (
                <div style={{ color: "#8a5c3a", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px", paddingTop: 4 }}>
                  Special request: {booking.specialRequests}
                </div>
              )}
              {booking.balanceAmount > 0 && (
                <div style={{ color: "#b83a3a", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px", paddingTop: 4, fontWeight: "bold" }}>
                  Outstanding balance: {booking.currency} {Number(booking.balanceAmount).toLocaleString("en-IN")} ({booking.paymentStatus})
                </div>
              )}
              {isCheckOut && booking.googleReviewUrl && (
                <div style={{ color: "#2f5c8a", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px", paddingTop: 4 }}>
                  Actions: Ask for review &middot; Group photo &middot; Instagram mention{" "}
                  {booking.instagramUrl ? `(${booking.instagramUrl})` : ""}
                </div>
              )}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}
