import React from "react";
import {
  EmailShell,
  EmailHeader,
  EmailHero,
  EmailSection,
  EmailFooter,
  DataRow,
  CTAButton,
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
  googleReviewUrl?: string;
  caretakerNumber: string;
  instagramUrl?: string;
}

export function CheckoutEmail(props: Props) {
  const theme = themes.checkout;
  const googleReview = props.googleReviewUrl || "https://search.google.com/local/writereview?placeid=PLACEHOLDER";
  const instagram = props.instagramUrl || "https://instagram.com/thestreambyekantah";

  return (
    <EmailShell theme={theme} title="Checkout | The Stream by Ekantah">
      <EmailHeader theme={theme} badge="Checkout" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="Until the mountains bring you back"
        headline={<>Thank you, {props.guestFirstName}.</>}
        body={
          <>
            We hope you enjoyed your stay at <strong>The Stream by Ekantah</strong> — the
            bonfire conversations, the dips in the private stream, the quiet mornings on
            your balcony. The river, the mountains, and the quiet were all a little brighter with you here.
          </>
        }
      />

      {/* Checkout reminder */}
      <EmailSection theme={theme} label="Checkout today" title={`Your checkout time is ${props.checkOutDate} at 11:00 AM.`} variant="warm">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          Please ensure all belongings are packed and keys are handed over to the caretaker.
          Safe travels, and we hope to see you again soon.
        </div>
      </EmailSection>

      {/* Stay recap */}
      <EmailSection theme={theme} label="Your Stay Recap" title="Here is a quick look back.">
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest" value={props.guestFullName} />
          <DataRow theme={theme} label="Dates" value={`${props.checkInDate} to ${props.checkOutDate}`} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow theme={theme} label="Rooms" value={`${props.roomCount} x ${props.roomType}`} />
        </table>
      </EmailSection>

      {/* Review request */}
      <EmailSection theme={theme} label="Rate us on Google" title="Your feedback means the world." variant="warm">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          If you enjoyed your stay, we would be incredibly grateful if you could leave us a
          review on Google. It helps more travelers discover The Stream by Ekantah.
        </div>
        <CTAButton theme={theme} href={googleReview} label="Leave a Review" />
      </EmailSection>

      {/* Instagram */}
      <EmailSection theme={theme} label="Share your story" title="Tag us on Instagram." variant="warm">
        <div style={{ color: theme.sectionBody, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: "24px" }}>
          Did you capture a beautiful sunset by the river or a cozy bonfire moment? We would
          love to see it. Please add stories for us on Instagram and tag{" "}
          <strong>@thestreambyekantah</strong>.
        </div>
        <CTAButton theme={theme} href={instagram} label="Follow on Instagram" />
      </EmailSection>

      {/* Contact */}
      <ContactBlock theme={theme} label="Stay in touch">
        {props.propertyAddress}
        <br />
        Phone: {props.propertyPhone}
        <br />
        Email: {props.propertyEmail}
        <br />
        Caretaker: {props.caretakerNumber} (Ram)
      </ContactBlock>

      <EmailFooter theme={theme}>
        <div style={{ color: theme.footerText, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: "22px" }}>
          The Stream by Ekantah &middot; Tirthan Valley, Himachal Pradesh &middot; The stream is always here when you need it.
        </div>
      </EmailFooter>
    </EmailShell>
  );
}
