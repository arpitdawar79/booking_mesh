interface BookingItem {
  bookingId: string;
  guestFullName: string;
  guestEmail: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  roomCount: number;
  roomType: string;
  caretakerNumber: string;
}

interface Props {
  date: string;
  checkIns: BookingItem[];
  checkOuts: BookingItem[];
}

export function AdminDailyDigestEmail(props: Props) {
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
        <title>Daily Digest | The Stream by Ekantah</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          background: "#f4f4f4",
          colorScheme: "light",
        }}
      >
        <center style={{ width: "100%", background: "#f4f4f4" }}>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", background: "#f4f4f4" }}
          >
            <tr>
              <td align="center" style={{ padding: "30px 12px" }}>
                <table
                  role="presentation"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    width: "100%",
                    maxWidth: 720,
                    background: "#ffffff",
                    border: "1px solid #d5d8df",
                  }}
                >
                  {/* Header */}
                  <tr>
                    <td
                      style={{
                        background: "#17294c",
                        padding: "26px 34px 22px",
                      }}
                    >
                      <div
                        style={{
                          color: "#b7c4d9",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 11,
                          lineHeight: "15px",
                          textTransform: "uppercase",
                          letterSpacing: "1.3px",
                          fontWeight: "bold",
                        }}
                      >
                        Daily Digest
                      </div>
                      <div
                        style={{
                          color: "#fffaf0",
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: 28,
                          lineHeight: "36px",
                          fontWeight: "normal",
                          paddingTop: 8,
                        }}
                      >
                        The Stream by Ekantah
                      </div>
                      <div
                        style={{
                          color: "#d9e0ec",
                          fontFamily: "Arial, Helvetica, sans-serif",
                          fontSize: 15,
                          lineHeight: "22px",
                          paddingTop: 6,
                        }}
                      >
                        {props.date}
                      </div>
                    </td>
                  </tr>

                  {/* Check-ins */}
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
                              Arriving Today
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
                              Guests checking in
                            </div>
                            {props.checkIns.length === 0 ? (
                              <div
                                style={{
                                  color: "#465149",
                                  fontFamily: "Arial, Helvetica, sans-serif",
                                  fontSize: 15,
                                  lineHeight: "24px",
                                  paddingTop: 14,
                                }}
                              >
                                No check-ins scheduled for today.
                              </div>
                            ) : (
                              <table
                                role="presentation"
                                width="100%"
                                cellPadding={0}
                                cellSpacing={0}
                                style={{ paddingTop: 14 }}
                              >
                                {props.checkIns.map((b) => (
                                  <BookingRow key={b.bookingId} booking={b} />
                                ))}
                              </table>
                            )}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  {/* Check-outs */}
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
                                color: "#7e5e4d",
                                fontFamily: "Arial, Helvetica, sans-serif",
                                fontSize: 11,
                                lineHeight: "15px",
                                textTransform: "uppercase",
                                letterSpacing: "1.3px",
                                fontWeight: "bold",
                              }}
                            >
                              Departing Today
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
                              Guests checking out
                            </div>
                            {props.checkOuts.length === 0 ? (
                              <div
                                style={{
                                  color: "#465149",
                                  fontFamily: "Arial, Helvetica, sans-serif",
                                  fontSize: 15,
                                  lineHeight: "24px",
                                  paddingTop: 14,
                                }}
                              >
                                No check-outs scheduled for today.
                              </div>
                            ) : (
                              <table
                                role="presentation"
                                width="100%"
                                cellPadding={0}
                                cellSpacing={0}
                                style={{ paddingTop: 14 }}
                              >
                                {props.checkOuts.map((b) => (
                                  <BookingRow key={b.bookingId} booking={b} />
                                ))}
                              </table>
                            )}
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

function BookingRow({ booking }: { booking: BookingItem }) {
  return (
    <tr>
      <td style={{ paddingBottom: 16, borderBottom: "1px solid #e0e0e0" }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ paddingTop: 12 }}
        >
          <tr>
            <td>
              <div
                style={{
                  color: "#181d3b",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 15,
                  lineHeight: "21px",
                  fontWeight: "bold",
                }}
              >
                {booking.guestFullName}
              </div>
              <div
                style={{
                  color: "#465149",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 13,
                  lineHeight: "20px",
                  paddingTop: 2,
                }}
              >
                {booking.guestEmail} &middot; {booking.roomCount}x{" "}
                {booking.roomType} &middot; {booking.nightCount} night
                {booking.nightCount > 1 ? "s" : ""}
              </div>
              <div
                style={{
                  color: "#7b8175",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 12,
                  lineHeight: "18px",
                  paddingTop: 2,
                }}
              >
                {booking.checkInDate} &rarr; {booking.checkOutDate} &middot; ID:{" "}
                {booking.bookingId}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  );
}
