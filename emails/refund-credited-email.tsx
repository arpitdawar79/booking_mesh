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
  amountPaidOnline: string;
  balanceAmount: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  caretakerNumber: string;
  customMessage?: string;
}

export function RefundCreditedEmail(props: Props) {
  const theme = themes.refund;

  return (
    <EmailShell theme={theme} title="Refund Credited | The Stream by Ekantah">
      <EmailHeader theme={theme} badge="Refund Credited" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="All sorted"
        headline={<>Your refund is on its way, {props.guestFirstName}.</>}
        body={
          <>
            We have processed your refund for the cancelled reservation at{" "}
            <strong>The Stream by Ekantah</strong>. It should reflect in your account shortly.
            Whenever you are ready for the mountains again, the stream will be here.
          </>
        }
      />

      {/* Refund Summary */}
      <EmailSection theme={theme} label="Refund Summary" title="Here are the details.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest Name" value={props.guestFullName} />
          <DataRow theme={theme} label="Dates" value={`${props.checkInDate} to ${props.checkOutDate}`} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow theme={theme} label="Rooms" value={`${props.roomCount} x ${props.roomType}`} />
          <DataRow theme={theme} label="Total Amount" value={`${props.currency} ${props.totalBookingAmount}`} />
          <DataRow theme={theme} label="Amount Paid Online" value={`${props.currency} ${props.amountPaidOnline}`} />
          <DataRow theme={theme} label="Refund Amount" value={`${props.currency} ${props.amountPaidOnline}`} />
          <DataRow theme={theme} label="Balance" value={`${props.currency} ${props.balanceAmount}`} />
        </table>
      </EmailSection>

      {/* Custom message */}
      {props.customMessage && (
        <EmailSection theme={theme} label="Message from us" title="A note from our team." variant="success">
          <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
            {props.customMessage}
          </div>
        </EmailSection>
      )}

      {/* Timeline note */}
      <EmailSection theme={theme} label="When will you see it?" title="Refund timeline." variant="warm">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          Refunds typically reflect within 5–7 business days depending on your bank or
          payment provider. If you do not see it after that, please reach out to us with your booking ID.
        </div>
      </EmailSection>

      {/* Contact */}
      <ContactBlock theme={theme} label="Questions?">
        If you have any questions about your refund, please contact us at {props.propertyPhone} or {props.propertyEmail}.
      </ContactBlock>

      <EmailFooter theme={theme} />
    </EmailShell>
  );
}
