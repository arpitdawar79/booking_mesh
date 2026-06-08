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
}

export function ThankYouEmail(props: Props) {
  const theme = themes.thankyou;

  return (
    <EmailShell theme={theme} title="Thank You | The Stream by Ekantah">
      <EmailHeader theme={theme} badge="Thank You" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="You are missed already"
        headline={<>Thank you, {props.guestFirstName}.</>}
        body={
          <>
            It was a pleasure hosting you at <strong>The Stream by Ekantah</strong>. We hope
            the river dips, the bonfire stories, and the balcony mornings gave you exactly
            the pause you were looking for.
          </>
        }
      />

      {/* Stay recap */}
      <EmailSection theme={theme} label="Your Stay Recap" title="Here is a quick look back.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest" value={props.guestFullName} />
          <DataRow theme={theme} label="Dates" value={`${props.checkInDate} to ${props.checkOutDate}`} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow theme={theme} label="Rooms" value={`${props.roomCount} x ${props.roomType}`} />
        </table>
      </EmailSection>

      {/* Come back soon */}
      <EmailSection theme={theme} label="Come back soon" title="The stream is always here." variant="cool">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          Whether it is another escape to the valley or a different season altogether, we
          would love to welcome you back. Reach out anytime.
        </div>
      </EmailSection>

      {/* Review request */}
      <EmailSection theme={theme} label="Share your story" title="Help others discover us." variant="warm">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          If you enjoyed your stay, we would be grateful if you could leave us a review. It
          helps more travelers discover The Stream by Ekantah.
        </div>
      </EmailSection>

      {/* Contact */}
      <ContactBlock theme={theme} label="Stay in touch">
        {props.propertyAddress}
        <br />
        Phone: {props.propertyPhone}
        <br />
        Email: {props.propertyEmail}
      </ContactBlock>

      <EmailFooter theme={theme} />
    </EmailShell>
  );
}
