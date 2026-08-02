const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const toIcsDate = (date) => dayjs(date).utc().format("YYYYMMDDTHHmmss[Z]");

const escapeIcsText = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

const buildBookingIcs = (booking, hostDisplayName) => {
  const summary = `Session with ${hostDisplayName}`;
  const descriptionParts = [`Booking reference: ${booking.bookingReference}`];

  if (booking.notes) {
    descriptionParts.push(`Notes: ${booking.notes}`);
  }

  if (booking.meetingUrl) {
    descriptionParts.push(`Join link: ${booking.meetingUrl}`);
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Slotly//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@slotly`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(booking.startsAt)}`,
    `DTEND:${toIcsDate(booking.endsAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${descriptionParts.map(escapeIcsText).join("\\n")}`,
    ...(booking.meetingUrl ? [`LOCATION:${escapeIcsText(booking.meetingUrl)}`] : []),
    `STATUS:${booking.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
};

const buildGoogleCalendarUrl = (booking, hostDisplayName) => {
  const summary = `Session with ${hostDisplayName}`;
  const descriptionParts = [`Booking reference: ${booking.bookingReference}`];

  if (booking.meetingUrl) {
    descriptionParts.push(`Join link: ${booking.meetingUrl}`);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    dates: `${toIcsDate(booking.startsAt)}/${toIcsDate(booking.endsAt)}`,
    details: descriptionParts.join("\n"),
    location: booking.meetingUrl || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

module.exports = {
  buildBookingIcs,
  buildGoogleCalendarUrl,
};
