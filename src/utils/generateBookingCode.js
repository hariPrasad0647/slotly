
const crypto = require("crypto");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateBookingCode = () => {
  let code = "";

  for (let i = 0; i < 8; i += 1) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }

  return `BK-${code}`;
};

module.exports = generateBookingCode;
