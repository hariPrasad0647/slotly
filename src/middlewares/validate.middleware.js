
const ApiError = require("../utils/ApiError");

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = source === "query" ? req.query : req.body;
    const result = schema.safeParse(data || {});

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(new ApiError(422, "Validation failed", errors));
    }

    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req.body = result.data;
    }

    return next();
  };
};

module.exports = validate;
