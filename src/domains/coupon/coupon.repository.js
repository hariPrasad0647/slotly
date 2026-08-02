
const prisma = require("../../repositories/prisma/prismaClient");

const create = (data) => {
  return prisma.coupon.create({ data });
};

const findById = (id) => {
  return prisma.coupon.findUnique({ where: { id } });
};

const findByHostAndCode = (hostProfileId, code) => {
  return prisma.coupon.findUnique({
    where: { hostProfileId_code: { hostProfileId, code } },
  });
};

const findByHostProfileId = (hostProfileId, { isActive } = {}) => {
  return prisma.coupon.findMany({
    where: {
      hostProfileId,
      ...(isActive !== undefined ? { isActive } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
};

const update = (id, data) => {
  return prisma.coupon.update({ where: { id }, data });
};

const deleteById = (id) => {
  return prisma.coupon.delete({ where: { id } });
};

module.exports = {
  create,
  findById,
  findByHostAndCode,
  findByHostProfileId,
  update,
  deleteById,
};
