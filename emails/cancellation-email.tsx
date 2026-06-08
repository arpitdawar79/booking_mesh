import React from "react";
import {
  EmailShell,
  EmailHeader,
  EmailHero,
  EmailSection,
  EmailFooter,
  DataRow,
  ContactBlock,
  themes,
} from "./components";

interface Props {
  bookingId: string;
  guestFirstName: string;
  guestFullName: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: string;
  roomCount: string;
  roomType: string;
  currency: string;
  totalBookingAmount: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  caretakerNumber: string;
  customMessage?: string;
}

export function CancellationEmail(props: Props) {
  const theme = themes.cancellation;

  return (
    <EmailShell theme={theme} title="Booking Cancelled | The Stream by Ekantah">
      <EmailHeader theme={theme} badge="Booking Cancelled" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="A change of plans"
        headline={<>Your booking has been cancelled, {props.guestFirstName}.</>}
        body={
          <>
            We are sorry to see you go. The stream will keep flowing, and our door stays
            open whenever the mountains call you back. Your reservation has been cancelled as requested.
          </>
        }
      />

      {/* Cancelled Stay Details */}
      <EmailSection theme={theme} label="Cancelled Stay Details" title="Details of the cancelled reservation.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest Name" value={props.guestFullName} />
          <DataRow theme={theme} label="Dates" value={`${props.checkInDate} to ${props.checkOutDate}`} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow theme={theme} label="Rooms" value={`${props.roomCount} x ${props.roomType}`} />
          <DataRow theme={theme} label="Total Amount" value={`${props.currency} ${props.totalBookingAmount}`} />
          <DataRow theme={theme} label="Caretaker" value={`${props.caretakerNumber} (Ram)`} />
        </table>
      </EmailSection>

      {/* Custom message */}
      {props.customMessage && (
        <EmailSection theme={theme} label="Message from us" title="A few words from our team." variant="alert">
          <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
            {props.customMessage}
          </div>
        </EmailSection>
      )}

      {/* Contact */}
      <ContactBlock theme={theme} label="Questions?">
        If you have any questions about your cancellation or refund, please contact us at{" "}
        {props.propertyPhone} or {props.propertyEmail}.
      </ContactBlock>

      <EmailFooter theme={theme} />
    </EmailShell>
  );
}
