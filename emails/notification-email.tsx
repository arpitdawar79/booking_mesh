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
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  caretakerNumber: string;
  customMessage?: string;
}

export function NotificationEmail(props: Props) {
  const theme = themes.notification;

  return (
    <EmailShell theme={theme} title="Notification | The Stream by Ekantah">
      <EmailHeader theme={theme} badge="Notification" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="A note from the valley"
        headline={<>Hello {props.guestFirstName}, something to share.</>}
        body={
          <>
            Here is something we wanted to share about your upcoming stay at{" "}
            <strong>The Stream by Ekantah</strong> — your quiet corner by the river in Tirthan Valley.
          </>
        }
      />

      {/* Message */}
      <EmailSection theme={theme} label="Message" title="Here is what you need to know.">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          {props.customMessage || "We wanted to reach out with an important update regarding your reservation. Please read below for details."}
        </div>
      </EmailSection>

      {/* Booking reminder */}
      <EmailSection theme={theme} label="Your stay" title="Just a quick reminder." variant="warm">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest" value={props.guestFullName} />
          <DataRow theme={theme} label="Dates" value={`${props.checkInDate} to ${props.checkOutDate}`} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow theme={theme} label="Rooms" value={`${props.roomCount} x ${props.roomType}`} />
        </table>
      </EmailSection>

      {/* Contact */}
      <ContactBlock theme={theme} label="Questions?">
        If you have any questions, please contact us at {props.propertyPhone} or {props.propertyEmail}.
      </ContactBlock>

      <EmailFooter theme={theme} />
    </EmailShell>
  );
}
