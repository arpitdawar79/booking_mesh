import {
  ContactBlock,
  DataRow,
  EmailFooter,
  EmailHeader,
  EmailHero,
  EmailSection,
  EmailShell,
  InfoCard,
  themes,
} from "./components";

interface Props {
  bookingId: string;
  guestFirstName: string;
  guestFullName: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  nightCount: string;
  roomCount: string;
  roomType: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  caretakerNumber: string;
  parkingDetails: string;
  mapLink: string;
}

export function PreArrivalEmail(props: Props) {
  const theme = themes.prearrival;

  return (
    <EmailShell
      theme={theme}
      title="Your stay is coming | The Stream by Ekantah"
    >
      <EmailHeader theme={theme} badge="Reminder" bookingId={props.bookingId} />

      <EmailHero
        theme={theme}
        tagline="The valley is waiting"
        headline={<>Hello {props.guestFirstName}, your room is ready.</>}
        body={
          <>
            We are getting everything ready for you at{" "}
            <strong>The Stream by Ekantah</strong> — fluffing the pillows in
            your river-facing room, stoking the bonfire pit, and setting the
            table at Tony's Cafe. Here is everything you need to know before you
            arrive.
          </>
        }
      />

      {/* Booking reminder */}
      <EmailSection
        theme={theme}
        label="Your stay"
        title="Just a quick reminder."
        variant="warm"
      >
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <DataRow theme={theme} label="Guest" value={props.guestFullName} />
          <DataRow
            theme={theme}
            label="Dates"
            value={`${props.checkInDate} to ${props.checkOutDate}`}
          />
          <DataRow theme={theme} label="Check-in" value={props.checkInTime} />
          <DataRow theme={theme} label="Nights" value={props.nightCount} />
          <DataRow
            theme={theme}
            label="Rooms"
            value={`${props.roomCount} x ${props.roomType}`}
          />
        </table>
      </EmailSection>

      {/* Things to do */}
      <EmailSection
        theme={theme}
        label="During your stay"
        title="Things you can do at our property."
      >
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <InfoCard
            theme={theme}
            icon="&#127794;"
            title="Hidden Waterfall Trek"
            description="A short and scenic river trek leads to a hidden waterfall just 50 metres from the property."
          />
          <InfoCard
            theme={theme}
            icon="&#127754;"
            title="Private Stream Access"
            description="Dip your feet in our private stream — it flows right beside the property, perfect for morning reflection or a quiet afternoon."
          />
          <InfoCard
            theme={theme}
            icon="&#128293;"
            title="Bonfire Under the Stars"
            description="Gather around our charming bonfire area for shared stories and warmth. Just let us know and we will light it up."
          />
          <InfoCard
            theme={theme}
            icon="&#127860;"
            title="Tony's Riverside Cafe"
            description="Enjoy soulful meals with soulful music at our charming riverside cafe — right here on the property."
          />
          <InfoCard
            theme={theme}
            icon="&#127748;"
            title="Sunset from Your Balcony"
            description="Watch the sky turn golden over the valley from your private balcony, the garden, or the riverside cafe."
          />
          <InfoCard
            theme={theme}
            icon="&#128247;"
            title="Valley Birdlife"
            description="The Tirthan valley is rich with vibrant birdlife. Bring your camera and keep an eye out from your balcony or the garden."
          />
          <InfoCard
            theme={theme}
            icon="&#127926;"
            title="Cozy Evenings"
            description="Movie nights, karaoke, books, and games await in our cozy common room with a 65&Prime; smart TV."
          />
        </table>
      </EmailSection>

      {/* Travel info */}
      <EmailSection
        theme={theme}
        label="Getting here"
        title="A few helpful details."
        variant="warm"
      >
        <div
          style={{
            color: theme.sectionBody,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 15,
            lineHeight: "24px",
          }}
        >
          <strong>Parking:</strong> {props.parkingDetails}
          <br />
          <br />
          <strong>Caretaker:</strong> {props.caretakerNumber} (Ram)
          <br />
          <br />
          <strong>Map:</strong>{" "}
          <a
            href={props.mapLink}
            style={{
              color: theme.amountHighlight,
              textDecoration: "none",
              borderBottom: `1px solid ${theme.amountHighlight}`,
            }}
          >
            Open on Google Maps
          </a>
        </div>
      </EmailSection>

      {/* Contact */}
      <ContactBlock theme={theme} label="Questions?">
        If you have any questions, please contact us at {props.propertyPhone} or{" "}
        {props.propertyEmail}.
      </ContactBlock>

      <EmailFooter theme={theme} />
    </EmailShell>
  );
}
