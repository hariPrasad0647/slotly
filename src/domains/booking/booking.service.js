
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");
const env = require("../../config/env");
const zoomConfig = require("../../config/zoom");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const bookingConfirmationTemplate = require("../../templates/emails/bookingConfirmation.template");
const hostBookingNotificationTemplate = require("../../templates/emails/hostBookingNotification.template");
const cancellationTemplate = require("../../templates/emails/cancellation.template");
const hostBookingCancelledTemplate = require("../../templates/emails/hostBookingCancelled.template");
const bookingRescheduledTemplate = require("../../templates/emails/bookingRescheduled.template");
const hostBookingRescheduledTemplate = require("../../templates/emails/hostBookingRescheduled.template");
const reminderService = require("../notification/reminder.service");

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
const paymentService = require("../payment/payment.service");
const couponService = require("../coupon/coupon.service");
const { toCsv } = require("../../utils/csv.util");
const { buildBookingIcs, buildGoogleCalendarUrl } = require("../../utils/calendar.util");

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

    const meeting = zoomMeeting
      ? {
          joinUrl: zoomMeeting.participantJoinUrl,
          meetingId: zoomMeeting.meetingId,
          password: zoomMeeting.password,
        }
      : null;

    sendEmailSafely({
      to: result.booking.clientEmail,
      ...bookingRescheduledTemplate({
        clientName: result.booking.clientName,
        hostDisplayName: hostProfile.displayName,
        newStartsAt: formatInTz(result.booking.startsAt, result.booking.timezone),
        timezone: result.booking.timezone,
        bookingReference: result.booking.bookingReference,
        rescheduledBy: "host",
        meeting,
      }),
    });

    const hostUser = await authRepository.findUserById(userId);

    if (hostUser) {
      sendEmailSafely({
        to: hostUser.email,
        ...hostBookingRescheduledTemplate({
          hostDisplayName: hostProfile.displayName,
          clientName: result.booking.clientName,
          newStartsAt: formatInTz(result.booking.startsAt, result.booking.timezone),
          timezone: result.booking.timezone,
          bookingReference: result.booking.bookingReference,
          rescheduledBy: "host",
          meeting,
        }),
      });
    }

    await reminderService.cancelRemindersForBooking(result.booking.id);
    await reminderService.scheduleRemindersForBooking(result.booking);
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

const listPublicSlots = async (usernameOrSlug, { from, to, ruleId, durationMinutes, viewerTimezone }) => {
  const hostProfile = await getPublicHostProfile(usernameOrSlug);

  const slots = await bookingRepository.findPublicOpenSlots(hostProfile.id, {
    from,
    to,
    ruleId,
    durationMinutes,
  });

  if (!viewerTimezone) {
    return slots;
  }

  return slots.map((slot) => ({
    ...slot,
    startsAtLocal: formatInTz(slot.startsAt, viewerTimezone),
    endsAtLocal: formatInTz(slot.endsAt, viewerTimezone),
  }));
};

const listPublicSessionTypes = async (usernameOrSlug) => {
  const hostProfile = await getPublicHostProfile(usernameOrSlug);

  return bookingRepository.findPublicSessionTypes(hostProfile.id);
};

/* -------------------------------------------------------------------------- */
/* User: booking lifecycle                                                    */
/* -------------------------------------------------------------------------- */

const notifyBookingConfirmed = async (booking) => {
  const bookingWithHost = await bookingRepository.findBookingById(booking.id);
  const hostDisplayName = bookingWithHost.hostProfile.displayName;
  const hostEmail = bookingWithHost.hostProfile.user.email;

  const zoomMeeting = await createZoomMeetingForBooking(booking, hostDisplayName);

  if (zoomMeeting) {
    booking.meetingUrl = zoomMeeting.participantJoinUrl;
  }

  sendEmailSafely({
    to: booking.clientEmail,
    ...bookingConfirmationTemplate({
      clientName: booking.clientName,
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
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      notes: booking.notes,
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

  await reminderService.scheduleRemindersForBooking(booking);

  return zoomMeeting;
};

const createBooking = async (userId, { slotId, notes, couponCode }) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const slot = await bookingRepository.findSlotById(slotId);

  if (!slot) {
    throw new ApiError(404, "Slot not found");
  }

  const clientName = `${user.firstName} ${user.lastName || ""}`.trim();

  if (slot.isFree) {
    const booking = await bookingTransaction.claimSlotAndCreateBooking({
      slotId,
      userId: user.id,
      clientName,
      clientEmail: user.email,
      notes,
      source: "API",
    });

    await notifyBookingConfirmed(booking);

    return { booking, payment: null };
  }

  let appliedCoupon = null;
  let finalAmount = slot.price;
  let discountAmount = 0;

  if (couponCode) {
    const result = await couponService.validateCouponForBooking(
      slot.hostProfileId,
      couponCode,
      slot.price
    );

    appliedCoupon = result.coupon;
    finalAmount = result.finalAmount;
    discountAmount = result.discountAmount;
  }

  const couponClaim = appliedCoupon
    ? { id: appliedCoupon.id, maxRedemptions: appliedCoupon.maxRedemptions, discountAmount }
    : undefined;

  if (finalAmount <= 0) {
    const booking = await bookingTransaction.claimSlotAndCreateBooking({
      slotId,
      userId: user.id,
      clientName,
      clientEmail: user.email,
      notes,
      source: "API",
      coupon: couponClaim,
    });

    await notifyBookingConfirmed(booking);

    return { booking, payment: null };
  }

  const booking = await bookingTransaction.holdSlotForPayment({
    slotId,
    userId: user.id,
    clientName,
    clientEmail: user.email,
    notes,
    source: "API",
    holdMinutes: env.PAYMENT_HOLD_MINUTES,
    coupon: couponClaim,
  });

  let order;

  try {
    ({ order } = await paymentService.createOrderForBooking(booking, {
      amount: finalAmount,
      currency: slot.currency,
    }));
  } catch (error) {
    await bookingTransaction.releasePendingBooking(booking.id, "Payment order creation failed");
    logger.error({ err: error.message, bookingId: booking.id }, "Failed to create Razorpay order");
    throw new ApiError(502, "Could not initiate payment. Please try again.");
  }

  return {
    booking,
    payment: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    },
  };
};

const confirmPendingBooking = async (bookingId) => {
  const { booking, justConfirmed } = await bookingTransaction.finalizePendingBooking(bookingId);

  if (justConfirmed) {
    await notifyBookingConfirmed(booking);
  }

  return booking;
};

const failPendingBooking = async (bookingId, reason) => {
  return bookingTransaction.releasePendingBooking(bookingId, reason);
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

const getBookings = async (actingUser, { scope, ...filters }) => {
  if (scope === "hosted" && actingUser.role !== "USER") {
    const hostProfile = await availabilityService.getOwnHostProfile(actingUser.id);
    return bookingRepository.findBookingsForHost(hostProfile.id, filters);
  }

  return bookingRepository.findBookingsForUser(actingUser.id, filters);
};

const exportBookings = async (actingUser, { scope, ...filters }) => {
  const columns = [
    { label: "Booking Reference", value: (b) => b.bookingReference },
    { label: "Status", value: (b) => b.status },
    { label: "Client Name", value: (b) => b.clientName },
    { label: "Client Email", value: (b) => b.clientEmail },
    { label: "Starts At", value: (b) => dayjs(b.startsAt).toISOString() },
    { label: "Ends At", value: (b) => dayjs(b.endsAt).toISOString() },
    { label: "Timezone", value: (b) => b.timezone },
    { label: "Source", value: (b) => b.source },
    { label: "Notes", value: (b) => b.notes || "" },
    { label: "Cancellation Reason", value: (b) => b.cancellationReason || "" },
    { label: "Created At", value: (b) => dayjs(b.createdAt).toISOString() },
  ];

  if (scope === "hosted" && actingUser.role !== "USER") {
    const hostProfile = await availabilityService.getOwnHostProfile(actingUser.id);
    const bookings = await bookingRepository.findBookingsForHostExport(hostProfile.id, filters);
    return toCsv(columns, bookings);
  }

  const bookings = await bookingRepository.findBookingsForUserExport(actingUser.id, filters);
  return toCsv(
    [
      ...columns,
      { label: "Host", value: (b) => b.hostProfile?.displayName || "" },
    ],
    bookings
  );
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

  sendEmailSafely({
    to: existingBooking.hostProfile.user.email,
    ...hostBookingCancelledTemplate({
      hostDisplayName: existingBooking.hostProfile.displayName,
      clientName: booking.clientName,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      cancellationReason,
    }),
  });

  await reminderService.cancelRemindersForBooking(bookingId);

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

  const meeting = zoomMeeting
    ? {
        joinUrl: zoomMeeting.participantJoinUrl,
        meetingId: zoomMeeting.meetingId,
        password: zoomMeeting.password,
      }
    : null;

  sendEmailSafely({
    to: newBooking.clientEmail,
    ...bookingRescheduledTemplate({
      clientName: newBooking.clientName,
      hostDisplayName: existingBooking.hostProfile.displayName,
      newStartsAt: formatInTz(newBooking.startsAt, newBooking.timezone),
      timezone: newBooking.timezone,
      bookingReference: newBooking.bookingReference,
      rescheduledBy: "user",
      meeting,
    }),
  });

  sendEmailSafely({
    to: existingBooking.hostProfile.user.email,
    ...hostBookingRescheduledTemplate({
      hostDisplayName: existingBooking.hostProfile.displayName,
      clientName: newBooking.clientName,
      newStartsAt: formatInTz(newBooking.startsAt, newBooking.timezone),
      timezone: newBooking.timezone,
      bookingReference: newBooking.bookingReference,
      rescheduledBy: "user",
      meeting,
    }),
  });

  await reminderService.cancelRemindersForBooking(bookingId);
  await reminderService.scheduleRemindersForBooking(newBooking);

  return newBooking;
};

const assertHostOwnsBooking = async (actingUser, booking) => {
  if (actingUser.role === "USER") {
    throw new ApiError(403, "You do not have permission to perform this action");
  }

  const hostProfile = await availabilityService.getOwnHostProfile(actingUser.id);

  if (booking.hostProfileId !== hostProfile.id) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
};

const completeBooking = async (actingUser, bookingId) => {
  const existingBooking = await bookingRepository.findBookingById(bookingId);

  if (!existingBooking) {
    throw new ApiError(404, "Booking not found");
  }

  await assertHostOwnsBooking(actingUser, existingBooking);

  return bookingTransaction.markBookingCompleted(bookingId);
};

const markNoShow = async (actingUser, bookingId, { reason }) => {
  const existingBooking = await bookingRepository.findBookingById(bookingId);

  if (!existingBooking) {
    throw new ApiError(404, "Booking not found");
  }

  await assertHostOwnsBooking(actingUser, existingBooking);

  return bookingTransaction.markBookingNoShow(bookingId, reason);
};

const getBookingCalendar = async (actingUser, bookingId, format) => {
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

  const hostDisplayName = booking.hostProfile.displayName;

  if (format === "google") {
    return { url: buildGoogleCalendarUrl(booking, hostDisplayName) };
  }

  return {
    filename: `booking-${booking.bookingReference}.ics`,
    content: buildBookingIcs(booking, hostDisplayName),
  };
};

module.exports = {
  generateSlots,
  listSlotsForHost,
  rescheduleSlot,
  deleteSlot,
  getPublicHostProfile,
  listPublicSlots,
  listPublicSessionTypes,
  createBooking,
  getBookingById,
  getBookings,
  exportBookings,
  cancelBooking,
  rescheduleBooking,
  confirmPendingBooking,
  failPendingBooking,
  completeBooking,
  markNoShow,
  getBookingCalendar,
};
