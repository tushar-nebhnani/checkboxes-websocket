import { AppError } from "./AppError.js";

const GENERIC_MESSAGE = "Something went wrong. Please try again later.";

export class ErrorHandler {
  static GENERIC_MESSAGE = GENERIC_MESSAGE;

  static log(context, err) {
    console.error(`[${context}]`, err);
  }

  // Converts an error thrown inside a service-layer task into an AppError,
  // logging the original error so internal details never leak past this point.
  static wrapServiceError(err, context, fallbackMessage = GENERIC_MESSAGE) {
    ErrorHandler.log(context, err);
    if (err instanceof AppError) return err;
    return new AppError(fallbackMessage, 500, "INTERNAL_ERROR");
  }

  static handleControllerError(err, res, context) {
    ErrorHandler.log(context, err);
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: GENERIC_MESSAGE });
  }
}
