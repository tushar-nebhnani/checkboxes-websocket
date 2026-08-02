import { ErrorHandler } from "../utils/ErrorHandler.js";

export class Validator {
  static validate(schema) {
    return (req, res, next) => {
      try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
          });
        }
        req.body = result.data;
        next();
      } catch (err) {
        ErrorHandler.handleControllerError(err, res, "Validator.validate");
      }
    };
  }
}
