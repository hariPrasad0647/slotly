
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const prisma = require("../../repositories/prisma/prismaClient");
const logger = require("../../config/logger");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const dailyAgendaTemplate = require("../../templates/emails/dailyAgenda.template");
const { shouldNotifyUser } = require("./reminder.service");

const formatInTz = (date, timezone) => dayjs(date).tz(timezone).format("h:mm A");

const sendEmailSafely = (options) => {
  sendEmail(options).catch((error) => {
    logger.error({ err: error, to: options.to }, "Failed to send daily agenda email");
  });
};

const sendDailyAgendas = async () => {
  const now = new Date();
  const windowEnd = dayjs(now).add(24, "hour").toDate();

  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", startsAt: { gte: now, lte: windowEnd } },
    include: {
      hostProfile: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const bookingsByHost = new Map();

  bookings.forEach((booking) => {
    const list = bookingsByHost.get(booking.hostProfileId) || [];
    list.push(booking);
    bookingsByHost.set(booking.hostProfileId, list);
  });

  for (const hostBookings of bookingsByHost.values()) {
    const hostProfile = hostBookings[0].hostProfile;

    if (!(await shouldNotifyUser(hostProfile.userId))) {
      continue;
    }

    sendEmailSafely({
      to: hostProfile.user.email,
      ...dailyAgendaTemplate({
        hostDisplayName: hostProfile.displayName,
        bookings: hostBookings.map((booking) => ({
          timeLabel: formatInTz(booking.startsAt, booking.timezone),
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          bookingReference: booking.bookingReference,
        })),
      }),
    });
  }

  return bookingsByHost.size;
};

module.exports = {
  sendDailyAgendas,
};
