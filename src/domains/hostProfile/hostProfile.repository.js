
const prisma = require("../../repositories/prisma/prismaClient");

const findByUserId = (userId) => {
  return prisma.hostProfile.findUnique({ where: { userId } });
};

const update = (id, data) => {
  return prisma.hostProfile.update({ where: { id }, data });
};

module.exports = {
  findByUserId,
  update,
};
