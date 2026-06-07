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
  currency: string;
  totalBookingAmount: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  caretakerNumber: string;
  customMessage?: string;
}

export function CancellationEmail(props: Props) {
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
        <title>Booking Cancelled | The Stream by Ekantah</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          background: "#f3edec",
          colorScheme: "light",
        }}
      >
        <center style={{ width: "100%", background: "#f3edec" }}>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", background: "#f3edec" }}
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
                    background: "#fff7f7",
                    border: "1px solid #dfd5d5",
                  }}
                >
                  {/* Header */}
                  <tr>
                    <td
                      style={{
                        background: "#f7eaea",
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
                                color: "#7e4d4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Booking Cancelled
                            </div>
                            <div
                              style={{
                                color: "#3b1818",
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
                      style={{ background: "#4c1717", padding: "38px 34px 0" }}
                    >
                      <div
                        style={{
                          color: "#d9b7b7",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 12,
                          lineHeight: "18px",
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          fontWeight: "bold",
                        }}
                      >
                        Reservation update
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
                        Your booking has been cancelled, {props.guestFirstName}.
                      </div>
                      <div
                        style={{
                          color: "#ecd9d9",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 15,
                          lineHeight: "25px",
                          paddingTop: 16,
                        }}
                      >
                        We are sorry to see you go. Your reservation at The
                        Stream by Ekantah has been cancelled as requested.
                      </div>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{ background: "#f7eaea", marginTop: 28 }}
                      >
                        <tr>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#a47a7a",
                            }}
                          >
                            &nbsp;
                          </td>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#d9b7b7",
                            }}
                          >
                            &nbsp;
                          </td>
                          <td
                            style={{
                              height: 9,
                              lineHeight: "9px",
                              background: "#b65555",
                            }}
                          >
                            &nbsp;
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Details */}
                  <tr>
                    <td style={{ padding: "28px 34px 8px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        style={{
                          background: "#f6eeee",
                          border: "1px solid #ddc9c9",
                        }}
                      >
                        <tr>
                          <td style={{ padding: 22 }}>
                            <div
                              style={{
                                color: "#7e4d4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Cancelled Stay Details
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
                              Details of the cancelled reservation.
                            </div>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                              style={{ paddingTop: 12 }}
                            >
                              <Row
                                label="Guest Name"
                                value={props.guestFullName}
                              />
                              <Row
                                label="Dates"
                                value={`${props.checkInDate} to ${props.checkOutDate}`}
                              />
                              <Row label="Nights" value={props.nightCount} />
                              <Row
                                label="Rooms"
                                value={`${props.roomCount} x ${props.roomType}`}
                              />
                              <Row
                                label="Total Amount"
                                value={`${props.currency} ${props.totalBookingAmount}`}
                              />
                              <Row
                                label="Caretaker"
                                value={`${props.caretakerNumber} (Ram)`}
                              />
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Custom message */}
                  {props.customMessage && (
                    <tr>
                      <td style={{ padding: "8px 34px 8px" }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{
                            background: "#fff0f0",
                            border: "1px solid #e4c1c1",
                          }}
                        >
                          <tr>
                            <td style={{ padding: 22 }}>
                              <div
                                style={{
                                  color: "#7e4d4d",
                                  fontFamily: "Arial, Helvetica, sans-serif",
                                  fontSize: 11,
                                  lineHeight: "15px",
                                  textTransform: "uppercase",
                                  letterSpacing: "1.3px",
                                  fontWeight: "bold",
                                }}
                              >
                                Message from us
                              </div>
                              <div
                                style={{
                                  color: "#3b1818",
                                  fontFamily: "Arial, Helvetica, sans-serif",
                                  fontSize: 15,
                                  lineHeight: "24px",
                                  paddingTop: 10,
                                }}
                              >
                                {props.customMessage}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  )}

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
                              If you have any questions about your cancellation
                              or refund, please contact us at{" "}
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
                          borderTop: "1px solid #dfd5d5",
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
              color: "#3b1818",
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
