const isSupportedTimezone = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  isSupportedTimezone,
};
