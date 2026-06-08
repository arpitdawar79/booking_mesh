import React from "react";
import {
  EmailShell,
  EmailHeader,
  EmailHero,
  EmailSection,
  EmailFooter,
  DataRow,
  AmountRow,
  CTAButton,
  ContactBlock,
  themes,
} from "./components";

interface Props {
  bookingId: string;
  bookingDate: string;
  guestFirstName: string;
  guestFullName: string;
  guestEmail: string;
  adultCount: string;
  childCount: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  nightCount: string;
  roomCount: string;
  roomType: string;
  mealPlan: string;
  currency: string;
  totalBookingAmount: string;
  amountPaidOnline: string;
  balanceAmount: string;
  paymentStatus: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  parkingDetails: string;
  mapLink: string;
  cancellationPolicy: string;
  specialRequests: string;
  caretakerNumber: string;
  upiQrCodeUrl?: string;
}

export function BookingConfirmationEmail(props: Props) {
  const theme = themes.booking;

  return (
    <EmailShell theme={theme} title="Booking Confirmation | The Stream by Ekantah">
      <EmailHeader theme={theme} badge="Booking Confirmed" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="A riverside pause awaits you"
        headline={<>See you by the stream, {props.guestFirstName}.</>}
        body={
          <>
            Thank you for choosing <strong>The Stream by Ekantah</strong> — our hidden
            5-room boutique stay by the river in Tirthan Valley. Your room with its
            warm, bohemian touches and private balcony is ready.
          </>
        }
      />

      {/* Stay Snapshot */}
      <EmailSection theme={theme} label="Stay Snapshot" title="A quiet room, river air, and time to slow down.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest Name" value={props.guestFullName} />
          <DataRow theme={theme} label="Guests" value={`${props.adultCount} adults, ${props.childCount} child`} />
          <DataRow theme={theme} label="Check-in" value={`${props.checkInDate} after ${props.checkInTime}`} />
          <DataRow theme={theme} label="Check-out" value={`${props.checkOutDate} by ${props.checkOutTime}`} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow theme={theme} label="Rooms" value={`${props.roomCount} x ${props.roomType}`} />
          <DataRow theme={theme} label="Meal plan" value={props.mealPlan} />
        </table>
      </EmailSection>

      {/* Payment Summary */}
      <EmailSection theme={theme} label="Payment Summary" title="Here is what has been paid and what remains.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <AmountRow theme={theme} label="Total booking amount" amount={`${props.currency} ${props.totalBookingAmount}`} />
          <AmountRow theme={theme} label="Paid online" amount={`${props.currency} ${props.amountPaidOnline}`} />
          <AmountRow theme={theme} label="Balance payable at property" amount={`${props.currency} ${props.balanceAmount}`} highlight />
        </table>
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px", paddingTop: 16 }}>
          Payment status: <strong>{props.paymentStatus}</strong>
        </div>

        {props.upiQrCodeUrl && (
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 22 }}>
            <tr>
              <td style={{ background: theme.headerBg, border: `1px solid ${theme.sectionBorder}`, borderRadius: 14, padding: 20 }} align="center">
                <div style={{ color: theme.sectionLabel, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10, lineHeight: "14px", textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: "bold", paddingBottom: 12 }}>
                  Scan to pay balance
                </div>
                <img src={props.upiQrCodeUrl} alt="UPI QR Code" width={160} height={160} style={{ display: "block", width: 160, height: 160, maxWidth: "100%", borderRadius: 10, border: `1px solid ${theme.sectionBorder}` }} />
                <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: "18px", paddingTop: 12 }}>
                  UPI ID: mab.037215011470041@axisbank
                </div>
              </td>
            </tr>
          </table>
        )}
      </EmailSection>

      {/* Arrival Details */}
      <EmailSection theme={theme} label="Arrival Details" title="Everything you need before you arrive." variant="warm">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Property" value={props.propertyAddress} />
          <DataRow theme={theme} label="Phone" value={props.propertyPhone} />
          <DataRow theme={theme} label="Email" value={props.propertyEmail} />
          <DataRow theme={theme} label="Caretaker" value={`${props.caretakerNumber} (Ram)`} />
          <DataRow theme={theme} label="Parking" value={props.parkingDetails} />
          <DataRow theme={theme} label="Map" value={<a href={props.mapLink} style={{ color: theme.amountHighlight, textDecoration: "none", borderBottom: `1px solid ${theme.amountHighlight}` }}>Open in Google Maps</a>} />
        </table>
      </EmailSection>

      {/* Policies */}
      <EmailSection theme={theme} label="Policies" title="Important things to know.">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          <strong>Cancellation policy:</strong> {props.cancellationPolicy}
        </div>
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px", paddingTop: 12 }}>
          <strong>Special requests:</strong> {props.specialRequests}
        </div>
      </EmailSection>

      {/* Contact */}
      <ContactBlock theme={theme} label="Questions?">
        If you have any questions, simply reply to this email or call us at{" "}
        {props.propertyPhone}. We are here to help — and we cannot wait to welcome you to the stream.
      </ContactBlock>

      <EmailFooter theme={theme}>
        <div style={{ color: theme.footerText, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "22px" }}>
          The Stream by Ekantah &middot; Tirthan Valley, Himachal Pradesh
        </div>
      </EmailFooter>
    </EmailShell>
  );
}
