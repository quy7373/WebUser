/**
 * Custom Business Error class để phân biệt lỗi nghiệp vụ với lỗi hệ thống
 */
export class BusinessError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Lỗi Prisma hoặc cú pháp không lường trước
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Email đã tồn tại trong hệ thống (DB constraint violation).',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error. Vui lòng thử lại sau.',
  });
};

