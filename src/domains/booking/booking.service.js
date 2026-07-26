
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");
const zoomConfig = require("../../config/zoom");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const bookingConfirmationTemplate = require("../../templates/emails/bookingConfirmation.template");
const hostBookingNotificationTemplate = require("../../templates/emails/hostBookingNotification.template");
const cancellationTemplate = require("../../templates/emails/cancellation.template");
const bookingRescheduledTemplate = require("../../templates/emails/bookingRescheduled.template");

const bookingRepository = require("./booking.repository");
const bookingTransaction = require("./booking.transaction");
const slotGenerationService = require("./slotGeneration.service");
const { hasOverlappingSlot } = require("./bookingConflict.service");
const { assertBookingAccess, assertBookingOwner, assertSlotOwnership } = require("./booking.policy");
const availabilityService = require("../availability/availability.service");
const availabilityRepository = require("../availability/availability.repository");
const authRepository = require("../auth/auth.repository");
const zoomService = require("../zoom/zoom.service");
const zoomRepository = require("../zoom/zoom.repository");

const formatInTz = (date, timezone) => dayjs(date).tz(timezone).format("dddd, MMMM D, YYYY [at] h:mm A");

const sendEmailSafely = (options) => {
  sendEmail(options).catch((error) => {
    logger.error({ err: error, to: options.to }, "Failed to send booking email");
  });
};

const minutesBetween = (start, end) => Math.round((end.getTime() - start.getTime()) / 60000);

const createZoomMeetingForBooking = async (booking, hostDisplayName) => {
  if (!zoomConfig.isConfigured) {
    return null;
  }

  try {
    const zoomMeeting = await zoomService.createMeeting({
      topic: `${hostDisplayName} & ${booking.clientName}`,
      agenda: booking.notes || undefined,
      startTime: booking.startsAt,
      durationMinutes: minutesBetween(booking.startsAt, booking.endsAt),
      timezone: booking.timezone,
    });

    await zoomRepository.create({
      bookingId: booking.id,
      providerMeetingId: String(zoomMeeting.id),
      hostJoinUrl: zoomMeeting.start_url,
      participantJoinUrl: zoomMeeting.join_url,
      password: zoomMeeting.password || null,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      createdByProvider: true,
      metadata: { agenda: zoomMeeting.agenda, topic: zoomMeeting.topic },
    });

    await bookingRepository.setBookingMeetingUrl(booking.id, zoomMeeting.join_url);

    return {
      meetingId: zoomMeeting.id,
      password: zoomMeeting.password || null,
      participantJoinUrl: zoomMeeting.join_url,
      hostJoinUrl: zoomMeeting.start_url,
    };
  } catch (error) {
    logger.error(
      { err: error.response?.data || error.message, bookingId: booking.id },
      "Failed to create Zoom meeting for booking"
    );

    return null;
  }
};

const updateZoomMeetingForBooking = async ({ oldBookingId, newBookingId, startsAt, endsAt }) => {
  const zoomMeeting = await zoomRepository.findByBookingId(oldBookingId);

  if (!zoomMeeting) {
    return null;
  }

  try {
    await zoomService.updateMeeting(zoomMeeting.providerMeetingId, {
      startTime: startsAt,
      durationMinutes: minutesBetween(startsAt, endsAt),
    });
  } catch (error) {
    logger.error(
      { err: error.response?.data || error.message, bookingId: oldBookingId },
      "Failed to update Zoom meeting time"
    );
  }

  const targetBookingId = newBookingId || oldBookingId;

  const updated = await zoomRepository.moveToBooking(zoomMeeting.id, {
    bookingId: targetBookingId,
    startsAt,
    endsAt,
  });

  await bookingRepository.setBookingMeetingUrl(targetBookingId, updated.participantJoinUrl);

  return {
    meetingId: updated.providerMeetingId,
    password: updated.password,
    participantJoinUrl: updated.participantJoinUrl,
    hostJoinUrl: updated.hostJoinUrl,
  };
};

const deleteZoomMeetingForBooking = async (bookingId) => {
  const zoomMeeting = await zoomRepository.findByBookingId(bookingId);

  if (!zoomMeeting) {
    return false;
  }

  try {
    await zoomService.deleteMeeting(zoomMeeting.providerMeetingId);
  } catch (error) {
    logger.error(
      { err: error.response?.data || error.message, bookingId },
      "Failed to delete Zoom meeting"
    );
  }

  await zoomRepository.deleteByBookingId(bookingId);

  return true;
};

/* -------------------------------------------------------------------------- */
/* Admin: slot generation                                                     */
/* -------------------------------------------------------------------------- */

const generateSlots = async (userId, input) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  if (input.ruleId) {
    const rule = await availabilityRepository.findRuleById(input.ruleId);

    if (!rule || rule.hostProfileId !== hostProfile.id) {
      throw new ApiError(404, "Availability rule not found");
    }

    return slotGenerationService.generateSlotsFromRule({
      hostProfile,
      rule,
      startDate: input.startDate,
      endDate: input.endDate,
    });
  }

  return slotGenerationService.generateManualSlots({
    hostProfile,
    slots: input.slots,
    timezone: input.timezone,
  });
};

/* -------------------------------------------------------------------------- */
/* Admin: own slot management                                                 */
/* -------------------------------------------------------------------------- */

const listSlotsForHost = async (userId, filters) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  return bookingRepository.findSlotsForHost(hostProfile.id, filters);
};

const rescheduleSlot = async (userId, slotId, { newStartsAt, newEndsAt }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);
  const slot = await bookingRepository.findSlotById(slotId);

  assertSlotOwnership(slot, hostProfile.id);

  const overlaps = await hasOverlappingSlot({
    hostProfileId: hostProfile.id,
    startsAt: newStartsAt,
    endsAt: newEndsAt,
    excludeSlotId: slotId,
    bufferMinutes: hostProfile.meetingBufferMinutes || 0,
  });

  if (overlaps) {
    throw new ApiError(409, "The new time overlaps with another existing slot");
  }

  const result = await bookingTransaction.rescheduleSlotAdmin({
    slotId,
    newStartsAt,
    newEndsAt,
  });

  if (result.booking) {
    const zoomMeeting = await updateZoomMeetingForBooking({
      oldBookingId: result.booking.id,
      startsAt: result.booking.startsAt,
      endsAt: result.booking.endsAt,
    });

    if (zoomMeeting) {
      result.booking.meetingUrl = zoomMeeting.participantJoinUrl;
    }

    sendEmailSafely({
      to: result.booking.clientEmail,
      ...bookingRescheduledTemplate({
        clientName: result.booking.clientName,
        hostDisplayName: hostProfile.displayName,
        newStartsAt: formatInTz(result.booking.startsAt, result.booking.timezone),
        timezone: result.booking.timezone,
        bookingReference: result.booking.bookingReference,
        rescheduledBy: "host",
        meeting: zoomMeeting
          ? {
              joinUrl: zoomMeeting.participantJoinUrl,
              meetingId: zoomMeeting.meetingId,
              password: zoomMeeting.password,
            }
          : null,
      }),
    });
  }

  return result;
};

const deleteSlot = async (userId, slotId) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);
  const slot = await bookingRepository.findSlotById(slotId);

  assertSlotOwnership(slot, hostProfile.id);

  return bookingTransaction.deleteUnbookedSlot(slotId);
};

/* -------------------------------------------------------------------------- */
/* Public browsing                                                            */
/* -------------------------------------------------------------------------- */

const getPublicHostProfile = async (usernameOrSlug) => {
  const hostProfile = await bookingRepository.findPublicHostProfile(usernameOrSlug);

  if (!hostProfile) {
    throw new ApiError(404, "Host not found");
  }

  return hostProfile;
};

const listPublicSlots = async (usernameOrSlug, { from, to }) => {
  const hostProfile = await getPublicHostProfile(usernameOrSlug);

  return bookingRepository.findPublicOpenSlots(hostProfile.id, { from, to });
};

/* -------------------------------------------------------------------------- */
/* User: booking lifecycle                                                    */
/* -------------------------------------------------------------------------- */

const createBooking = async (userId, { slotId, notes }) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const clientName = `${user.firstName} ${user.lastName || ""}`.trim();

  const booking = await bookingTransaction.claimSlotAndCreateBooking({
    slotId,
    userId: user.id,
    clientName,
    clientEmail: user.email,
    notes,
    source: "API",
  });

  const bookingWithHost = await bookingRepository.findBookingById(booking.id);
  const hostDisplayName = bookingWithHost.hostProfile.displayName;
  const hostEmail = bookingWithHost.hostProfile.user.email;

  const zoomMeeting = await createZoomMeetingForBooking(booking, hostDisplayName);

  sendEmailSafely({
    to: booking.clientEmail,
    ...bookingConfirmationTemplate({
      clientName,
      hostDisplayName,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      meeting: zoomMeeting
        ? {
            joinUrl: zoomMeeting.participantJoinUrl,
            meetingId: zoomMeeting.meetingId,
            password: zoomMeeting.password,
          }
        : null,
    }),
  });

  sendEmailSafely({
    to: hostEmail,
    ...hostBookingNotificationTemplate({
      hostDisplayName,
      clientName,
      clientEmail: booking.clientEmail,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      notes,
      meeting: zoomMeeting
        ? {
            joinUrl: zoomMeeting.participantJoinUrl,
            startUrl: zoomMeeting.hostJoinUrl,
            meetingId: zoomMeeting.meetingId,
            password: zoomMeeting.password,
          }
        : null,
    }),
  });

  return booking;
};

const getBookingById = async (actingUser, bookingId) => {
  const booking = await bookingRepository.findBookingById(bookingId);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const hostProfile =
    actingUser.role !== "USER"
      ? await availabilityService.getOwnHostProfile(actingUser.id).catch(() => null)
      : null;

  assertBookingAccess(booking, {
    userId: actingUser.id,
    hostProfileId: hostProfile?.id,
  });

  return booking;
};

const getBookings = async (actingUser, { status, scope }) => {
  if (scope === "hosted" && actingUser.role !== "USER") {
    const hostProfile = await availabilityService.getOwnHostProfile(actingUser.id);
    return bookingRepository.findBookingsForHost(hostProfile.id, { status });
  }

  return bookingRepository.findBookingsForUser(actingUser.id, { status });
};

const cancelBooking = async (actingUser, bookingId, { cancellationReason }) => {
  const existingBooking = await bookingRepository.findBookingById(bookingId);

  if (!existingBooking) {
    throw new ApiError(404, "Booking not found");
  }

  const hostProfile =
    actingUser.role !== "USER"
      ? await availabilityService.getOwnHostProfile(actingUser.id).catch(() => null)
      : null;

  assertBookingAccess(existingBooking, {
    userId: actingUser.id,
    hostProfileId: hostProfile?.id,
  });

  const booking = await bookingTransaction.cancelBookingAndReleaseSlot({
    bookingId,
    cancellationReason,
  });

  const hadMeeting = await deleteZoomMeetingForBooking(bookingId);

  sendEmailSafely({
    to: booking.clientEmail,
    ...cancellationTemplate({
      clientName: booking.clientName,
      hostDisplayName: existingBooking.hostProfile.displayName,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      cancellationReason,
      hadMeeting,
    }),
  });

  return booking;
};

const rescheduleBooking = async (userId, bookingId, { newSlotId }) => {
  const existingBooking = await bookingRepository.findBookingById(bookingId);

  if (!existingBooking) {
    throw new ApiError(404, "Booking not found");
  }

  assertBookingOwner(existingBooking, userId);

  const newBooking = await bookingTransaction.rescheduleBookingToNewSlot({
    bookingId,
    newSlotId,
  });

  const zoomMeeting = await updateZoomMeetingForBooking({
    oldBookingId: bookingId,
    newBookingId: newBooking.id,
    startsAt: newBooking.startsAt,
    endsAt: newBooking.endsAt,
  });

  if (zoomMeeting) {
    newBooking.meetingUrl = zoomMeeting.participantJoinUrl;
  }

  sendEmailSafely({
    to: newBooking.clientEmail,
    ...bookingRescheduledTemplate({
      clientName: newBooking.clientName,
      hostDisplayName: existingBooking.hostProfile.displayName,
      newStartsAt: formatInTz(newBooking.startsAt, newBooking.timezone),
      timezone: newBooking.timezone,
      bookingReference: newBooking.bookingReference,
      rescheduledBy: "user",
      meeting: zoomMeeting
        ? {
            joinUrl: zoomMeeting.participantJoinUrl,
            meetingId: zoomMeeting.meetingId,
            password: zoomMeeting.password,
          }
        : null,
    }),
  });

  return newBooking;
};

module.exports = {
  generateSlots,
  listSlotsForHost,
  rescheduleSlot,
  deleteSlot,
  getPublicHostProfile,
  listPublicSlots,
  createBooking,
  getBookingById,
  getBookings,
  cancelBooking,
  rescheduleBooking,
};
