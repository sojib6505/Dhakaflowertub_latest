export const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Turns database errors into messages the admin dashboard can show.
const describeError = (err) => {
  if (err.name === 'ValidationError') {
    return { status: 400, message: Object.values(err.errors).map((item) => item.message).join(' ') };
  }
  if (err.name === 'CastError') {
    return { status: 400, message: `Invalid value for ${err.path}.` };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return { status: 409, message: `That ${field} is already in use.` };
  }
  if (err.type === 'entity.parse.failed') {
    return { status: 400, message: 'The request body is not valid JSON.' };
  }
  return null;
};

export const errorHandler = (err, req, res, next) => {
  const described = describeError(err);
  const statusCode = described?.status || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    message: described?.message || err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
