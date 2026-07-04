export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, error, message = 'Error', statusCode = 400) => {
  console.error(error);
  res.status(statusCode).json({
    success: false,
    message,
    error: error.message || error
  });
};

export const sendValidationError = (res, errors) => {
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};
