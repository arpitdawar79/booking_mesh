import React from "react";

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
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style
          dangerouslySetInnerHTML={{ __html: ":root { color-scheme: light; }" }}
        />
        <title>Booking Confirmation | The Stream by Ekantah</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          background: "#edf3ec",
          colorScheme: "light",
        }}
      >
        <center style={{ width: "100%", background: "#edf3ec" }}>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", background: "#edf3ec" }}
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
                    background: "#fffdf7",
                    border: "1px solid #d8dfd5",
                  }}
                >
                  {/* Header */}
                  <tr>
                    <td style={{ background: "#f7f4ea" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                      >
                        <tr>
                          <td style={{ padding: "26px 34px 22px" }}>
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
                                      color: "#7e6b4d",
                                      fontFamily:
                                        "Arial, Helvetica, sans-serif",
                                      fontSize: 11,
                                      lineHeight: "15px",
                                      textTransform: "uppercase",
                                      letterSpacing: "1.3px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Booking Confirmation
                                  </div>
                                  <div
                                    style={{
                                      color: "#183b34",
                                      fontFamily:
                                        "Arial, Helvetica, sans-serif",
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
                      </table>
                    </td>
                  </tr>

                  {/* Hero */}
                  <tr>
                    <td style={{ background: "#174c43" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                      >
                        <tr>
                          <td style={{ padding: "38px 34px 0" }}>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                            >
                              <tr>
                                <td style={{ background: "#174c43" }}>
                                  <div
                                    style={{
                                      color: "#d9c79b",
                                      fontFamily:
                                        "Arial, Helvetica, sans-serif",
                                      fontSize: 12,
                                      lineHeight: "18px",
                                      textTransform: "uppercase",
                                      letterSpacing: "1.5px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Your riverside pause is confirmed
                                  </div>
                                  <div
                                    style={{
                                      color: "#fffaf0",
                                      fontFamily:
                                        "Georgia, 'Times New Roman', serif",
                                      fontSize: 38,
                                      lineHeight: "46px",
                                      fontWeight: "normal",
                                      paddingTop: 10,
                                    }}
                                  >
                                    See you beside the stream,{" "}
                                    {props.guestFirstName}.
                                  </div>
                                  <div
                                    style={{
                                      color: "#dfece2",
                                      fontFamily:
                                        "Arial, Helvetica, sans-serif",
                                      fontSize: 15,
                                      lineHeight: "25px",
                                      paddingTop: 16,
                                    }}
                                  >
                                    Thank you for choosing The Stream by
                                    Ekantah, our hidden 5-room boutique stay by
                                    the river in Tirthan Valley. Your booking
                                    has been received and confirmed.
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td style={{ paddingTop: 28 }}>
                                  <table
                                    role="presentation"
                                    width="100%"
                                    cellPadding={0}
                                    cellSpacing={0}
                                    style={{ background: "#f7f4ea" }}
                                  >
                                    <tr>
                                      <td
                                        style={{
                                          height: 9,
                                          lineHeight: "9px",
                                          background: "#7aa497",
                                        }}
                                      >
                                        &nbsp;
                                      </td>
                                      <td
                                        style={{
                                          height: 9,
                                          lineHeight: "9px",
                                          background: "#d9c79b",
                                        }}
                                      >
                                        &nbsp;
                                      </td>
                                      <td
                                        style={{
                                          height: 9,
                                          lineHeight: "9px",
                                          background: "#b67855",
                                        }}
                                      >
                                        &nbsp;
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Stay Snapshot */}
                  <tr>
                    <td style={{ padding: "28px 34px 8px" }}>
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
                          <td style={{ padding: "22px 22px 8px" }}>
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
                              Stay Snapshot
                            </div>
                            <div
                              style={{
                                color: "#183b34",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              A quiet room, river air, and time to slow down.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px 22px 22px" }}>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                            >
                              <Row
                                label="Guest Name"
                                value={props.guestFullName}
                              />
                              <Row
                                label="Guests"
                                value={`${props.adultCount} adults, ${props.childCount} child`}
                              />
                              <Row
                                label="Check-in"
                                value={`${props.checkInDate} after ${props.checkInTime}`}
                              />
                              <Row
                                label="Check-out"
                                value={`${props.checkOutDate} by ${props.checkOutTime}`}
                              />
                              <Row label="Nights" value={props.nightCount} />
                              <Row
                                label="Rooms"
                                value={`${props.roomCount} x ${props.roomType}`}
                              />
                              <Row label="Meal plan" value={props.mealPlan} />
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Payment Summary */}
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
                          <td style={{ padding: "22px 22px 8px" }}>
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
                              Payment Summary
                            </div>
                            <div
                              style={{
                                color: "#183b34",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Here is what has been paid and what remains.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px 22px 22px" }}>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                            >
                              <AmountRow
                                label="Total booking amount"
                                amount={`${props.currency} ${props.totalBookingAmount}`}
                              />
                              <AmountRow
                                label="Paid online"
                                amount={`${props.currency} ${props.amountPaidOnline}`}
                              />
                              <AmountRow
                                label="Balance payable at property"
                                amount={`${props.currency} ${props.balanceAmount}`}
                                highlight
                              />
                            </table>
                            <div
                              style={{
                                color: "#465149",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 15,
                                lineHeight: "24px",
                                paddingTop: 14,
                              }}
                            >
                              Payment status:{" "}
                              <strong>{props.paymentStatus}</strong>
                            </div>
                            {props.upiQrCodeUrl && (
                              <table
                                role="presentation"
                                width="100%"
                                cellPadding={0}
                                cellSpacing={0}
                                style={{ marginTop: 20 }}
                              >
                                <tr>
                                  <td
                                    style={{
                                      background: "#f7f4ea",
                                      border: "1px solid #e5ddcb",
                                      padding: 18,
                                    }}
                                    align="center"
                                  >
                                    <div
                                      style={{
                                        color: "#7e6b4d",
                                        fontFamily:
                                          "Arial, Helvetica, sans-serif",
                                        fontSize: 11,
                                        lineHeight: "15px",
                                        textTransform: "uppercase",
                                        letterSpacing: "1.3px",
                                        fontWeight: "bold",
                                        paddingBottom: 10,
                                      }}
                                    >
                                      Scan to pay balance
                                    </div>
                                    <img
                                      src={props.upiQrCodeUrl}
                                      alt="UPI QR Code"
                                      width={160}
                                      height={160}
                                      style={{
                                        display: "block",
                                        width: 160,
                                        height: 160,
                                        maxWidth: "100%",
                                      }}
                                    />
                                    <div
                                      style={{
                                        color: "#465149",
                                        fontFamily:
                                          "Arial, Helvetica, sans-serif",
                                        fontSize: 12,
                                        lineHeight: "18px",
                                        paddingTop: 10,
                                      }}
                                    >
                                      UPI ID: mab.037215011470041@axisbank
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            )}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Arrival Details */}
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
                          <td style={{ padding: "22px 22px 8px" }}>
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
                              Arrival Details
                            </div>
                            <div
                              style={{
                                color: "#183b34",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Everything you need before you arrive.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px 22px 22px" }}>
                            <table
                              role="presentation"
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                            >
                              <Row
                                label="Property"
                                value={props.propertyAddress}
                              />
                              <Row label="Phone" value={props.propertyPhone} />
                              <Row label="Email" value={props.propertyEmail} />
                              <Row
                                label="Caretaker"
                                value={`${props.caretakerNumber} (Ram)`}
                              />
                              <Row
                                label="Parking"
                                value={props.parkingDetails}
                              />
                              <Row
                                label="Map"
                                value={
                                  <a
                                    href={props.mapLink}
                                    style={{ color: "#28665f" }}
                                  >
                                    Open in Google Maps
                                  </a>
                                }
                              />
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Policies */}
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
                          <td style={{ padding: "22px 22px 8px" }}>
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
                              Policies
                            </div>
                            <div
                              style={{
                                color: "#183b34",
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: 23,
                                lineHeight: "29px",
                                fontWeight: "normal",
                                paddingTop: 6,
                              }}
                            >
                              Important things to know.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px 22px 22px" }}>
                            <div
                              style={{
                                color: "#465149",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 15,
                                lineHeight: "24px",
                              }}
                            >
                              <strong>Cancellation policy:</strong>{" "}
                              {props.cancellationPolicy}
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
                              <strong>Special requests:</strong>{" "}
                              {props.specialRequests}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Footer */}
                  <tr>
                    <td style={{ padding: "28px 34px 34px" }}>
                      <table
                        role="presentation"
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                      >
                        <tr>
                          <td
                            style={{
                              borderTop: "1px solid #d8dfd5",
                              paddingTop: 22,
                            }}
                          >
                            <div
                              style={{
                                color: "#465149",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 15,
                                lineHeight: "24px",
                              }}
                            >
                              If you have any questions, simply reply to this
                              email or call us at {props.propertyPhone}. We are
                              here to help.
                            </div>
                            <div
                              style={{
                                color: "#737b70",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 12,
                                lineHeight: "18px",
                                paddingTop: 18,
                              }}
                            >
                              The Stream by Ekantah &middot; Tirthan Valley,
                              Himachal Pradesh
                            </div>
                          </td>
                        </tr>
                      </table>
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
              color: "#183b34",
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

function AmountRow({
  label,
  amount,
  highlight,
}: {
  label: string;
  amount: string;
  highlight?: boolean;
}) {
  return (
    <tr>
      <td style={{ borderBottom: "1px solid #e5ddcb", padding: "10px 0" }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tr>
            <td>
              <div
                style={{
                  color: "#465149",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "24px",
                }}
              >
                {label}
              </div>
            </td>
            <td align="right">
              <div
                style={{
                  color: highlight ? "#b67855" : "#183b34",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "24px",
                  fontWeight: highlight ? "bold" : "normal",
                }}
              >
                {amount}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}
