
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const prisma = require("../../repositories/prisma/prismaClient");
const logger = require("../../config/logger");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const reminderTemplate = require("../../templates/emails/reminder.template");
const hostReminderTemplate = require("../../templates/emails/hostReminder.template");
const bookingRepository = require("../booking/booking.repository");
const zoomRepository = require("../zoom/zoom.repository");

const REMINDER_OFFSETS = [
  { type: "24h", hoursBefore: 24 },
  { type: "1h", hoursBefore: 1 },
];

const DUE_REMINDER_BATCH_SIZE = 100;

const formatInTz = (date, timezone) =>
  dayjs(date).tz(timezone).format("dddd, MMMM D, YYYY [at] h:mm A");

const sendEmailSafely = (options) => {
  sendEmail(options).catch((error) => {
    logger.error({ err: error, to: options.to }, "Failed to send reminder email");
  });
};

const scheduleRemindersForBooking = async (booking) => {
  const now = new Date();

  const rows = REMINDER_OFFSETS.map(({ type, hoursBefore }) => ({
    bookingId: booking.id,
    reminderType: type,
    scheduledFor: dayjs(booking.startsAt).subtract(hoursBefore, "hour").toDate(),
  })).filter((row) => row.scheduledFor > now);

  if (rows.length === 0) {
    return;
  }

  await prisma.reminderSchedule.createMany({ data: rows });
};

const cancelRemindersForBooking = async (bookingId) => {
  await prisma.reminderSchedule.deleteMany({ where: { bookingId, processed: false } });
};

const shouldNotifyUser = async (userId) => {
  if (!userId) {
    return true;
  }

  const preference = await prisma.notificationPreference.findUnique({ where: { userId } });

  if (!preference) {
    return true;
  }

  return preference.emailEnabled && preference.bookingReminders;
};

const hoursBeforeForType = (reminderType) => (reminderType === "24h" ? 24 : 1);

const sendReminderForSchedule = async (schedule) => {
  const booking = await bookingRepository.findBookingById(schedule.bookingId);

  if (!booking || booking.status !== "CONFIRMED") {
    return;
  }

  const hoursBefore = hoursBeforeForType(schedule.reminderType);
  const hostDisplayName = booking.hostProfile.displayName;
  const startsAtFormatted = formatInTz(booking.startsAt, booking.timezone);

  const zoomMeeting = await zoomRepository.findByBookingId(booking.id);
  const meeting = zoomMeeting
    ? {
        joinUrl: zoomMeeting.participantJoinUrl,
        meetingId: zoomMeeting.providerMeetingId,
        password: zoomMeeting.password,
      }
    : null;

  if (await shouldNotifyUser(booking.userId)) {
    sendEmailSafely({
      to: booking.clientEmail,
      ...reminderTemplate({
        clientName: booking.clientName,
        hostDisplayName,
        startsAt: startsAtFormatted,
        timezone: booking.timezone,
        bookingReference: booking.bookingReference,
        hoursBefore,
        meeting,
      }),
    });
  }

  if (await shouldNotifyUser(booking.hostProfile.userId)) {
    sendEmailSafely({
      to: booking.hostProfile.user.email,
      ...hostReminderTemplate({
        hostDisplayName,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        startsAt: startsAtFormatted,
        timezone: booking.timezone,
        bookingReference: booking.bookingReference,
        hoursBefore,
        meeting: meeting ? { ...meeting, startUrl: zoomMeeting.hostJoinUrl } : null,
      }),
    });
  }
};

const processDueReminders = async () => {
  const dueReminders = await prisma.reminderSchedule.findMany({
    where: { processed: false, scheduledFor: { lte: new Date() } },
    take: DUE_REMINDER_BATCH_SIZE,
  });

  for (const schedule of dueReminders) {
    try {
      await sendReminderForSchedule(schedule);
      await prisma.reminderSchedule.update({
        where: { id: schedule.id },
        data: { processed: true, processedAt: new Date() },
      });
    } catch (error) {
      logger.error(
        { err: error.message, reminderId: schedule.id },
        "Failed to process booking reminder"
      );
      await prisma.reminderSchedule.update({
        where: { id: schedule.id },
        data: { failedAt: new Date(), retryCount: { increment: 1 } },
      });
    }
  }

  return dueReminders.length;
};

module.exports = {
  scheduleRemindersForBooking,
  cancelRemindersForBooking,
  processDueReminders,
  shouldNotifyUser,
};
