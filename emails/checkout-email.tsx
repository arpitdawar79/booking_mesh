import React from "react";

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
  const googleReview =
    props.googleReviewUrl ||
    "https://search.google.com/local/writereview?placeid=PLACEHOLDER";
  const instagram =
    props.instagramUrl || "https://instagram.com/thestreambyekantah";

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
        <title>Checkout | The Stream by Ekantah</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          background: "#f0edec",
          colorScheme: "light",
        }}
      >
        <center style={{ width: "100%", background: "#f0edec" }}>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", background: "#f0edec" }}
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
                    background: "#fffaf7",
                    border: "1px solid #dfd8d5",
                  }}
                >
                  {/* Header */}
                  <tr>
                    <td
                      style={{
                        background: "#f7f0ea",
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
                                color: "#7e5e4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Checkout
                            </div>
                            <div
                              style={{
                                color: "#3b2018",
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
                      style={{ background: "#4c2e17", padding: "38px 34px 0" }}
                    >
                      <div
                        style={{
                          color: "#d9c4b7",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 12,
                          lineHeight: "18px",
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          fontWeight: "bold",
                        }}
                      >
                        It&apos;s time to say goodbye
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
                        Thank you, {props.guestFirstName}.
                      </div>
                      <div
                        style={{
                          color: "#ece2d9",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 15,
                          lineHeight: "25px",
                          paddingTop: 16,
                        }}
                      >
                        We hope you enjoyed your stay at The Stream by Ekantah.
                        The river, the mountains, and the quiet were all a
                        little brighter with you here.
                      </div>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{ background: "#f7f0ea", marginTop: 28 }}
                      >
                        <tr>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#a48a7a",
                            }}
                          >
                            &nbsp;
                          </td>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#d9c4b7",
                            }}
                          >
                            &nbsp;
                          </td>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#b67155",
                            }}
                          >
                            &nbsp;
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Checkout reminder */}
                  <tr>
                    <td style={{ padding: "28px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#f6eeea",
                          border: "1px solid #ddc9c4",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#7e5e4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Checkout today
                            </div>
                            <div
                              style={{
                                color: "#3b2018",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Your checkout time is {props.checkOutDate} at
                              11:00 AM.
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
                              Please ensure all belongings are packed and keys
                              are handed over to the caretaker. Safe travels,
                              and we hope to see you again soon.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Stay recap */}
                  <tr>
                    <td style={{ padding: "8px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#eef6ef",
                          border: "1px solid #c9ddce",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#5a7e4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Your Stay Recap
                            </div>
                            <div
                              style={{
                                color: "#183b20",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Here is a quick look back.
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

                  {/* Review request */}
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
                              Rate us on Google
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
                              Your feedback means the world.
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
                              If you enjoyed your stay, we would be incredibly
                              grateful if you could leave us a review on Google.
                              It helps more travelers discover The Stream by
                              Ekantah.
                            </div>
                            <table
                              role="presentation"
                              cellPadding={0}
                              cellSpacing={0}
                              style={{ marginTop: 16 }}
                            >
                              <tr>
                                <td
                                  style={{
                                    background: "#b67155",
                                    borderRadius: 4,
                                    padding: "12px 24px",
                                  }}
                                >
                                  <a
                                    href={googleReview}
                                    style={{
                                      color: "#fffaf0",
                                      fontFamily:
                                        "Arial, Helvetica, sans-serif",
                                      fontSize: 14,
                                      lineHeight: "20px",
                                      fontWeight: "bold",
                                      textDecoration: "none",
                                      display: "inline-block",
                                    }}
                                  >
                                    Leave a Review
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Instagram */}
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
                              Share your story
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
                              Tag us on Instagram.
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
                              Did you capture a beautiful sunset by the river or
                              a cozy bonfire moment? We would love to see it.
                              Please add stories for us on Instagram and tag{" "}
                              <strong>@thestreambyekantah</strong>.
                            </div>
                            <table
                              role="presentation"
                              cellPadding={0}
                              cellSpacing={0}
                              style={{ marginTop: 16 }}
                            >
                              <tr>
                                <td
                                  style={{
                                    background: "#a48a7a",
                                    borderRadius: 4,
                                    padding: "12px 24px",
                                  }}
                                >
                                  <a
                                    href={instagram}
                                    style={{
                                      color: "#fffaf0",
                                      fontFamily:
                                        "Arial, Helvetica, sans-serif",
                                      fontSize: 14,
                                      lineHeight: "20px",
                                      fontWeight: "bold",
                                      textDecoration: "none",
                                      display: "inline-block",
                                    }}
                                  >
                                    Follow on Instagram
                                  </a>
                                </td>
                              </tr>
                            </table>
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
                          background: "#f6eeea",
                          border: "1px solid #ddc9c4",
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
                              Stay in touch
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
                              {props.propertyAddress}
                              <br />
                              Phone: {props.propertyPhone}
                              <br />
                              Email: {props.propertyEmail}
                              <br />
                              Caretaker: {props.caretakerNumber} (Ram)
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
                          borderTop: "1px solid #dfd8d5",
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
              color: "#3b2018",
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
