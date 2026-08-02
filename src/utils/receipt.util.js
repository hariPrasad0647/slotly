const PDFDocument = require("pdfkit");
const dayjs = require("dayjs");

const { formatMoney } = require("./money.util");

const buildPaymentReceiptPdf = (payment) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { booking } = payment;
    const hostDisplayName = booking.hostProfile.displayName;
    const coupon = booking.couponRedemption;
    const totalRefunded = payment.refunds
      .filter((refund) => refund.status !== "FAILED")
      .reduce((sum, refund) => sum + refund.amount, 0);

    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(10).fillColor("#555").text(`Receipt for booking ${booking.bookingReference}`, {
      align: "center",
    });
    doc.moveDown(2);

    doc.fillColor("#000").fontSize(11);
    doc.text(`Payment ID: ${payment.id}`);
    if (payment.providerPaymentId) {
      doc.text(`Provider payment ID: ${payment.providerPaymentId}`);
    }
    doc.text(`Status: ${payment.status}`);
    doc.text(`Date: ${dayjs(payment.paidAt || payment.createdAt).format("MMMM D, YYYY [at] h:mm A")}`);
    doc.moveDown();

    doc.text(`Tutor: ${hostDisplayName}`);
    doc.text(`Client: ${booking.clientName} <${booking.clientEmail}>`);
    doc.text(
      `Session: ${dayjs(booking.startsAt).format("MMMM D, YYYY [at] h:mm A")} (${booking.timezone})`
    );
    doc.moveDown();

    if (coupon) {
      doc.text(`Coupon applied: ${coupon.coupon.code}`);
      doc.text(`Discount: -${formatMoney(coupon.discountAmount, payment.currency)}`);
      doc.moveDown();
    }

    doc.fontSize(14).text(`Amount paid: ${formatMoney(payment.amount, payment.currency)}`, {
      underline: true,
    });

    if (totalRefunded > 0) {
      doc.moveDown();
      doc.fontSize(11).text(`Refunded: ${formatMoney(totalRefunded, payment.currency)}`);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#888").text("This is a system-generated receipt.", {
      align: "center",
    });

    doc.end();
  });
};

module.exports = {
  buildPaymentReceiptPdf,
};
