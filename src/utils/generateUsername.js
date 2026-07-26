
const slugify = require("./slugify");

const generateUsername = (firstName, lastName) => {
  const base = slugify(`${firstName} ${lastName || ""}`);

  return base || "user";
};

module.exports = generateUsername;
