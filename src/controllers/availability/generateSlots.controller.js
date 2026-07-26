
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const generateSlotsController = asyncHandler(async (req, res) => {
  const { created, skipped } = await bookingService.generateSlots(
    req.user.id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(201, "Slot generation completed", {
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    })
  );
});

module.exports = {
  generateSlotsController,
};
