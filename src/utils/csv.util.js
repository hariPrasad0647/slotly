const FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/;

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  let stringValue = String(value);

  if (FORMULA_PREFIX_PATTERN.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const toCsv = (columns, rows) => {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(",");

  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.value(row))).join(",")
  );

  return [header, ...lines].join("\r\n");
};

module.exports = {
  toCsv,
};
