#!/usr/bin/env python3
"""Prompt for booking details, send the confirmation email, and save the sent HTML."""

from __future__ import annotations

import datetime as dt
import getpass
import html
import os
import re
import secrets
import smtplib
import ssl
from decimal import Decimal, InvalidOperation
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
TEMPLATE_PATH = BASE_DIR / "booking-confirmation-the-stream.html"
BOOKINGS_DIR = BASE_DIR / "bookings"

DEFAULTS = {
    "check_in_time": "2:00 PM",
    "check_out_time": "11:00 AM",
    "child_count": "0",
    "currency": "INR",
    "meal_plan": "As per booking",
    "parking_details": "Available near the property. Please contact us before arrival for exact guidance.",
    "property_address": "The Stream by Ekantah",
    "property_email": "digital@ekantah.com",
    "property_phone": "+91 ",
    "room_count": "1",
    "room_type": "Boutique Room",
    "map_link": "https://maps.google.com/?q=The%20Stream%20by%20Ekantah%20Tirthan%20Valley",
    "cancellation_policy": "As per the booking terms shared at the time of reservation.",
    "special_requests": "None shared.",
}


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PLACEHOLDER_RE = re.compile(r"\{\{([a-zA-Z0-9_]+)\}\}")


def prompt(label: str, required: bool = True, default: str | None = None) -> str:
    suffix = ""
    if default not in (None, ""):
        suffix = f" [{default}]"
    while True:
        value = input(f"{label}{suffix}: ").strip()
        if value:
            return value
        if default is not None:
            return default
        if not required:
            return ""
        print("This is required.")


def prompt_password(label: str, required: bool = True, default: str | None = None) -> str:
    suffix = " [from env]" if default else ""
    while True:
        value = getpass.getpass(f"{label}{suffix}: ").strip()
        if value:
            return value
        if default is not None:
            return default
        if not required:
            return ""
        print("This is required.")


def prompt_recipients(label: str, required: bool = False) -> list[str]:
    while True:
        raw = prompt(label, required=required, default=None if required else "")
        recipients = [item.strip() for item in raw.split(",") if item.strip()]
        invalid = [email_address for email_address in recipients if not EMAIL_RE.match(email_address)]
        if invalid:
            print(f"Invalid email address(es): {', '.join(invalid)}")
            continue
        if required and not recipients:
            print("At least one recipient is required.")
            continue
        return recipients


def prompt_decimal(label: str, required: bool = True, default: str | None = None) -> Decimal | None:
    while True:
        raw = prompt(label, required=required, default=default)
        if raw == "" and not required:
            return None
        try:
            return Decimal(raw.replace(",", ""))
        except InvalidOperation:
            print("Enter a valid amount, for example 12500 or 12500.50.")


def format_amount(amount: Decimal) -> str:
    amount = amount.quantize(Decimal("0.01"))
    if amount == amount.to_integral():
        return f"{amount:,.0f}"
    return f"{amount:,.2f}"


def parse_date(value: str) -> dt.date | None:
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d %b %Y", "%d %B %Y"):
        try:
            return dt.datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    return None


def calculate_nights(check_in_date: str, check_out_date: str) -> str:
    check_in = parse_date(check_in_date)
    check_out = parse_date(check_out_date)
    if not check_in or not check_out:
        return prompt("Number of nights")
    nights = (check_out - check_in).days
    if nights <= 0:
        print("Check-out date should be after check-in date.")
        return prompt("Number of nights")
    return str(nights)


def generate_booking_id() -> str:
    today = dt.datetime.now().strftime("%y%m%d")
    BOOKINGS_DIR.mkdir(exist_ok=True)
    for _ in range(100):
        booking_id = f"{today}{secrets.randbelow(10000):04d}"
        if not (BOOKINGS_DIR / f"{booking_id}.html").exists():
            return booking_id
    raise RuntimeError("Could not generate a unique booking ID.")


def render_template(values: dict[str, str]) -> str:
    template = TEMPLATE_PATH.read_text(encoding="utf-8")

    def replace(match: re.Match[str]) -> str:
        key = match.group(1)
        value = values.get(key)
        if value is None:
            raise KeyError(f"Missing template value: {key}")
        return html.escape(value, quote=True)

    return PLACEHOLDER_RE.sub(replace, template)


def collect_booking_details(to_recipients: list[str]) -> dict[str, str]:
    print("\nBooking details")
    guest_full_name = prompt("Guest full name")
    guest_first_name = guest_full_name.split()[0] if guest_full_name.split() else guest_full_name
    guest_email = prompt("Guest email", default=to_recipients[0])
    adult_count = prompt("Number of adults")
    child_count = prompt("Number of children", default=DEFAULTS["child_count"])
    check_in_date = prompt("Check-in date (YYYY-MM-DD preferred)")
    check_out_date = prompt("Check-out date (YYYY-MM-DD preferred)")
    night_count = calculate_nights(check_in_date, check_out_date)

    total_booking_amount = prompt_decimal("Total booking amount")
    amount_paid_online = prompt_decimal("Amount paid online")
    balance_amount = prompt_decimal(
        "Balance amount payable at property (blank to calculate)",
        required=False,
        default="",
    )
    if balance_amount is None:
        balance_amount = total_booking_amount - amount_paid_online

    payment_status = "Partially paid" if balance_amount > 0 else "Paid in full"

    values = {
        "booking_id": generate_booking_id(),
        "booking_date": dt.datetime.now().strftime("%Y-%m-%d"),
        "guest_first_name": guest_first_name,
        "guest_full_name": guest_full_name,
        "guest_email": guest_email,
        "adult_count": adult_count,
        "child_count": child_count,
        "check_in_date": check_in_date,
        "check_out_date": check_out_date,
        "check_in_time": prompt("Check-in time", default=DEFAULTS["check_in_time"]),
        "check_out_time": prompt("Check-out time", default=DEFAULTS["check_out_time"]),
        "night_count": night_count,
        "room_count": prompt("Number of rooms", default=DEFAULTS["room_count"]),
        "room_type": prompt("Room type", default=DEFAULTS["room_type"]),
        "meal_plan": prompt("Meal plan", default=DEFAULTS["meal_plan"]),
        "currency": prompt("Currency", default=DEFAULTS["currency"]),
        "total_booking_amount": format_amount(total_booking_amount),
        "amount_paid_online": format_amount(amount_paid_online),
        "balance_amount": format_amount(balance_amount),
        "payment_status": payment_status,
        "property_address": prompt("Property address", default=DEFAULTS["property_address"]),
        "property_phone": prompt("Property phone", default=DEFAULTS["property_phone"]),
        "property_email": prompt("Property email", default=DEFAULTS["property_email"]),
        "parking_details": prompt("Parking details", default=DEFAULTS["parking_details"]),
        "map_link": prompt("Map link", default=DEFAULTS["map_link"]),
        "cancellation_policy": prompt("Cancellation policy", default=DEFAULTS["cancellation_policy"]),
        "special_requests": prompt("Special requests", required=False, default=DEFAULTS["special_requests"]),
    }
    return values


def collect_smtp_details() -> dict[str, str | int | bool]:
    print("\nSMTP details")
    host = prompt("SMTP host", default=os.getenv("SMTP_HOST", "smtp.hostinger.com"))
    port = int(prompt("SMTP port", default=os.getenv("SMTP_PORT", "465")))
    username = prompt("SMTP username", required=False, default=os.getenv("SMTP_USERNAME", "digital@ekantah.com"))
    password = prompt_password(
        "SMTP password",
        required=bool(username),
        default=os.getenv("SMTP_PASSWORD"),
    )
    sender_email_default = os.getenv("SMTP_FROM_EMAIL") or username or "digital@ekantah.com"
    sender_email = prompt("From email", default=sender_email_default)
    sender_name = prompt("From name", default=os.getenv("SMTP_FROM_NAME", "The Stream by Ekantah"))
    reply_to = prompt("Reply-to email", required=False, default=os.getenv("SMTP_REPLY_TO", sender_email))
    encryption = prompt("Encryption: starttls, ssl, or none", default=os.getenv("SMTP_ENCRYPTION", "ssl")).lower()
    if encryption not in {"starttls", "ssl", "none"}:
        raise ValueError("Encryption must be starttls, ssl, or none.")
    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "sender_email": sender_email,
        "sender_name": sender_name,
        "reply_to": reply_to,
        "encryption": encryption,
    }


def build_message(
    values: dict[str, str],
    html_body: str,
    smtp_details: dict[str, str | int | bool],
    to_recipients: list[str],
    cc_recipients: list[str],
    bcc_recipients: list[str],
) -> EmailMessage:
    subject = f"Booking confirmed: The Stream by Ekantah #{values['booking_id']}"
    text_body = (
        f"Dear {values['guest_first_name']},\n\n"
        f"Your booking at The Stream by Ekantah is confirmed.\n\n"
        f"Booking ID: {values['booking_id']}\n"
        f"Guest: {values['guest_full_name']}\n"
        f"Guests: {values['adult_count']} adults, {values['child_count']} child\n"
        f"Dates: {values['check_in_date']} to {values['check_out_date']}\n"
        f"Rooms: {values['room_count']} x {values['room_type']}\n"
        f"Total booking amount: {values['currency']} {values['total_booking_amount']}\n"
        f"Paid online: {values['currency']} {values['amount_paid_online']}\n"
        f"Balance payable at property: {values['currency']} {values['balance_amount']}\n\n"
        "Please view the HTML version of this email for full arrival details.\n"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((str(smtp_details["sender_name"]), str(smtp_details["sender_email"])))
    message["To"] = ", ".join(to_recipients)
    if cc_recipients:
        message["Cc"] = ", ".join(cc_recipients)
    if smtp_details["reply_to"]:
        message["Reply-To"] = str(smtp_details["reply_to"])
    message["Date"] = formatdate(localtime=True)
    message["Message-ID"] = make_msgid(domain=str(smtp_details["sender_email"]).split("@")[-1])
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
    return message


def send_message(
    message: EmailMessage,
    smtp_details: dict[str, str | int | bool],
    to_recipients: list[str],
    cc_recipients: list[str],
    bcc_recipients: list[str],
) -> None:
    all_recipients = to_recipients + cc_recipients + bcc_recipients
    host = str(smtp_details["host"])
    port = int(smtp_details["port"])
    username = str(smtp_details["username"])
    password = str(smtp_details["password"])
    encryption = str(smtp_details["encryption"])

    if encryption == "ssl":
        with smtplib.SMTP_SSL(host, port, context=ssl.create_default_context()) as smtp:
            if username or password:
                smtp.login(username, password)
            smtp.send_message(message, to_addrs=all_recipients)
        return

    with smtplib.SMTP(host, port) as smtp:
        smtp.ehlo()
        if encryption == "starttls":
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
        if username or password:
            smtp.login(username, password)
        smtp.send_message(message, to_addrs=all_recipients)


def save_sent_html(booking_id: str, html_body: str) -> Path:
    BOOKINGS_DIR.mkdir(exist_ok=True)
    output_path = BOOKINGS_DIR / f"{booking_id}.html"
    output_path.write_text(html_body, encoding="utf-8")
    return output_path


def main() -> None:
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    print("The Stream by Ekantah booking confirmation sender")
    print("Enter multiple email addresses separated by commas.\n")

    to_recipients = prompt_recipients("To", required=True)
    cc_recipients = prompt_recipients("Cc", required=False)
    bcc_recipients = prompt_recipients("Bcc", required=False)

    values = collect_booking_details(to_recipients)
    smtp_details = collect_smtp_details()
    html_body = render_template(values)
    message = build_message(values, html_body, smtp_details, to_recipients, cc_recipients, bcc_recipients)

    print(f"\nReady to send booking #{values['booking_id']} to {', '.join(to_recipients)}.")
    if cc_recipients:
        print(f"Cc: {', '.join(cc_recipients)}")
    if bcc_recipients:
        print(f"Bcc: {', '.join(bcc_recipients)}")
    confirmation = prompt("Send now? Type yes to confirm", default="no").lower()
    if confirmation != "yes":
        print("Cancelled. No email was sent or saved.")
        return

    send_message(message, smtp_details, to_recipients, cc_recipients, bcc_recipients)
    saved_path = save_sent_html(values["booking_id"], html_body)
    print(f"Sent successfully. Saved sent email to: {saved_path}")


if __name__ == "__main__":
    main()
