const formatMoney = (amountInMinorUnits, currency = "INR") => {
  return `${(amountInMinorUnits / 100).toFixed(2)} ${currency}`;
};

module.exports = {
  formatMoney,
};
