# The Stream by Ekantah Email Templates

## Booking confirmation

Template file:

- `booking-confirmation-the-stream.html`

This is a responsive, table-based HTML email template designed for hotel booking confirmations.

## Required placeholders

- `{{booking_id}}`
- `{{booking_date}}`
- `{{guest_first_name}}`
- `{{guest_full_name}}`
- `{{guest_email}}`
- `{{adult_count}}`
- `{{child_count}}`
- `{{check_in_date}}`
- `{{check_out_date}}`
- `{{check_in_time}}`
- `{{check_out_time}}`
- `{{night_count}}`
- `{{room_count}}`
- `{{room_type}}`
- `{{meal_plan}}`
- `{{currency}}`
- `{{total_booking_amount}}`
- `{{amount_paid_online}}`
- `{{balance_amount}}`
- `{{payment_status}}`
- `{{property_address}}`
- `{{property_phone}}`
- `{{property_email}}`
- `{{parking_details}}`
- `{{map_link}}`
- `{{cancellation_policy}}`
- `{{special_requests}}`

## Notes

- The logo is loaded from `https://thestream.ekantah.com/wp-content/uploads/2025/06/the-stream-full.svg`.
- Replace placeholder syntax if your email platform uses a different format.
- Some email clients may not display SVG images. If needed, replace the logo URL with a PNG version.

## Send an email

Run the interactive sender:

```bash
python3 send_booking_confirmation.py
```

The script asks for:

- Required recipients: `To`
- Optional recipients: `Cc`, `Bcc`
- Required booking details: guest name, guest email, adults, dates, total amount, paid amount
- Optional booking details with defaults: children, timings, room count, room type, meal plan, property details, parking, map link, cancellation policy, special requests
- SMTP details: host, port, username, password, sender, reply-to, encryption mode

The SMTP prompts are prefilled for Hostinger:

- SMTP host: `smtp.hostinger.com`
- SMTP port: `465`
- SMTP username/from email: `digital@ekantah.com`
- Encryption: `ssl`

It auto-generates a numeric booking ID, sends the rendered HTML email, and then saves the exact sent email in:

```text
bookings/{booking_id}.html
```

You can also prefill SMTP details with environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `SMTP_REPLY_TO`
- `SMTP_ENCRYPTION` (`starttls`, `ssl`, or `none`)

For example:

```bash
export SMTP_PASSWORD='placeholder_password'
python3 send_booking_confirmation.py
```
