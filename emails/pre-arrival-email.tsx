import React from "react";

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
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style
          dangerouslySetInnerHTML={{ __html: ":root { color-scheme: light; }" }}
        />
        <title>Your stay is coming | The Stream by Ekantah</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          background: "#eceef3",
          colorScheme: "light",
        }}
      >
        <center style={{ width: "100%", background: "#eceef3" }}>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", background: "#eceef3" }}
          >
            <tr>
              <td align="center" style={{ padding: "30px 12px" }}>
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    width: "100%",
                    maxWidth: 680,
                    background: "#f7f9ff",
                    border: "1px solid #d5d8df",
                  }}
                >
                  {/* Header */}
                  <tr>
                    <td
                      style={{
                        background: "#eaeef7",
                        padding: "26px 34px 22px",
                      }}
                    >
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                      >
                        <tr>
                          <td valign="middle">
                            <img
                              src="https://thestream.ekantah.com/wp-content/uploads/2025/06/the-stream-full.svg"
                              width={188}
                              alt="The Stream by Ekantah"
                              style={{
                                display: "block",
                                maxWidth: 188,
                                height: "auto",
                              }}
                            />
                          </td>
                          <td valign="middle" align="right">
                            <div
                              style={{
                                color: "#4d5a7e",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Reminder
                            </div>
                            <div
                              style={{
                                color: "#181d3b",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 15,
                                lineHeight: "21px",
                                fontWeight: "bold",
                                paddingTop: 5,
                              }}
                            >
                              Reservation ID: {props.bookingId}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Hero */}
                  <tr>
                    <td
                      style={{ background: "#17294c", padding: "38px 34px 0" }}
                    >
                      <div
                        style={{
                          color: "#b7c4d9",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 12,
                          lineHeight: "18px",
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          fontWeight: "bold",
                        }}
                      >
                        Your stay is almost here
                      </div>
                      <div
                        style={{
                          color: "#fffaf0",
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: 38,
                          lineHeight: "46px",
                          fontWeight: "normal",
                          paddingTop: 10,
                        }}
                      >
                        Hello {props.guestFirstName}, see you tomorrow.
                      </div>
                      <div
                        style={{
                          color: "#d9e0ec",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 15,
                          lineHeight: "25px",
                          paddingTop: 16,
                        }}
                      >
                        We are getting everything ready for you at The Stream by
                        Ekantah. Here is everything you need to know before you
                        arrive.
                      </div>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{ background: "#eaeef7", marginTop: 28 }}
                      >
                        <tr>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#7a8aa4",
                            }}
                          >
                            &nbsp;
                          </td>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#b7c4d9",
                            }}
                          >
                            &nbsp;
                          </td>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#5571b6",
                            }}
                          >
                            &nbsp;
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Booking reminder */}
                  <tr>
                    <td style={{ padding: "28px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#fbf1e6",
                          border: "1px solid #e4d1b8",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#7e6b4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Your stay
                            </div>
                            <div
                              style={{
                                color: "#3b1818",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Just a quick reminder.
                            </div>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                              style={{ paddingTop: 12 }}
                            >
                              <Row label="Guest" value={props.guestFullName} />
                              <Row
                                label="Dates"
                                value={`${props.checkInDate} to ${props.checkOutDate}`}
                              />
                              <Row label="Check-in" value={props.checkInTime} />
                              <Row label="Nights" value={props.nightCount} />
                              <Row
                                label="Rooms"
                                value={`${props.roomCount} x ${props.roomType}`}
                              />
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Things to do */}
                  <tr>
                    <td style={{ padding: "8px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#eef2f6",
                          border: "1px solid #c9cdd9",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#4d5a7e",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              During your stay
                            </div>
                            <div
                              style={{
                                color: "#181d3b",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Things you can do at our property.
                            </div>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                              style={{ paddingTop: 14 }}
                            >
                              <ActivityRow
                                icon="&#127794;"
                                title="Nature Walks"
                                description="Explore scenic trails around the property and soak in the Himalayan views."
                              />
                              <ActivityRow
                                icon="&#127754;"
                                title="River Access"
                                description="Enjoy the fresh mountain stream right by the property. Perfect for a peaceful afternoon."
                              />
                              <ActivityRow
                                icon="&#128293;"
                                title="Bonfire Evenings"
                                description="Gather around a cozy bonfire under the stars. Let us know and we will arrange one for you."
                              />
                              <ActivityRow
                                icon="&#127860;"
                                title="Local Cuisine"
                                description="Savour home-cooked Himachali meals prepared with love by our local chefs."
                              />
                              <ActivityRow
                                icon="&#127748;"
                                title="Sunset Views"
                                description="Watch the sky turn golden over the valley from our rooftop and garden spots."
                              />
                              <ActivityRow
                                icon="&#128247;"
                                title="Bird Watching"
                                description="The valley is home to vibrant birdlife. Bring your camera and keep an eye out."
                              />
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Travel info */}
                  <tr>
                    <td style={{ padding: "8px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#fffaf0",
                          border: "1px solid #ded6c4",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#7e6b4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Getting here
                            </div>
                            <div
                              style={{
                                color: "#3b1818",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              A few helpful details.
                            </div>
                            <div
                              style={{
                                color: "#465149",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 15,
                                lineHeight: "24px",
                                paddingTop: 14,
                              }}
                            >
                              <strong>Parking:</strong> {props.parkingDetails}
                              <br />
                              <br />
                              <strong>Caretaker:</strong>{" "}
                              {props.caretakerNumber} (Ram)
                              <br />
                              <br />
                              <strong>Map:</strong>{" "}
                              <a
                                href={props.mapLink}
                                style={{ color: "#5571b6", fontWeight: "bold" }}
                              >
                                Open on Google Maps
                              </a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Contact */}
                  <tr>
                    <td style={{ padding: "8px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#fbf1e6",
                          border: "1px solid #e4d1b8",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#7e6b4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Questions?
                            </div>
                            <div
                              style={{
                                color: "#465149",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 15,
                                lineHeight: "24px",
                                paddingTop: 10,
                              }}
                            >
                              If you have any questions, please contact us at{" "}
                              {props.propertyPhone} or {props.propertyEmail}.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Footer */}
                  <tr>
                    <td style={{ padding: "28px 34px 34px" }}>
                      <div
                        style={{
                          borderTop: "1px solid #d5d8df",
                          paddingTop: 22,
                          color: "#737b70",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 12,
                          lineHeight: "18px",
                        }}
                      >
                        The Stream by Ekantah &middot; Tirthan Valley, Himachal
                        Pradesh
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <tr>
        <td style={{ paddingBottom: 4 }}>
          <div
            style={{
              color: "#7b8175",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 11,
              lineHeight: "15px",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              fontWeight: "bold",
            }}
          >
            {label}
          </div>
        </td>
      </tr>
      <tr>
        <td style={{ paddingBottom: 14 }}>
          <div
            style={{
              color: "#181d3b",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 15,
              lineHeight: "21px",
              fontWeight: "bold",
            }}
          >
            {value}
          </div>
        </td>
      </tr>
    </>
  );
}

function ActivityRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <tr>
      <td style={{ paddingBottom: 14 }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tr>
            <td style={{ width: 32, verticalAlign: "top", paddingTop: 2 }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
            </td>
            <td style={{ verticalAlign: "top" }}>
              <div
                style={{
                  color: "#181d3b",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "21px",
                  fontWeight: "bold",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  color: "#465149",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 14,
                  lineHeight: "22px",
                  paddingTop: 2,
                }}
              >
                {description}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}
