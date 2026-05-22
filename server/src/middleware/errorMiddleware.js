export const errorHandler = (err, _req, res, _next) => {
  const status = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ success: false, message: err.message });
};
