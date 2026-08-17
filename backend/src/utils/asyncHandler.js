// Wraps async route handlers so a rejected promise reaches errorHandler.js instead of
// crashing the process — Express 4 doesn't do this automatically.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
