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

  // Lỗi trùng lặp dữ liệu (DB constraint violation)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Email đã tồn tại trong hệ thống (DB constraint violation).',
    });
  }

  // Phát hiện lỗi PostgreSQL Read-Only Transaction (khi kết nối vào Standby Replica chưa promote)
  if (err.message && err.message.includes('cannot execute INSERT in a read-only transaction')) {
    return res.status(503).json({
      success: false,
      message: 'Cơ sở dữ liệu đang ở chế độ Chỉ Đọc (Standby). Hệ thống tự động Failover đang đồng bộ, vui lòng thử lại sau vài giây.',
    });
  }

  // Lỗi kết nối Database
  if (err.name === 'PrismaClientInitializationError') {
    return res.status(503).json({
      success: false,
      message: 'Không thể kết nối đến Cơ sở dữ liệu. Vui lòng kiểm tra trạng thái PostgreSQL.',
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error. Vui lòng thử lại sau.',
  });
};
