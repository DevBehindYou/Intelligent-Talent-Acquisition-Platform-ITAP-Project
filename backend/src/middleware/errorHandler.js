import { logger } from "../utils/logger.js";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message, details: err.details } });
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } });
}
