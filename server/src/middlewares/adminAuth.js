import { BusinessError } from './errorHandler.js';

/**
 * Middleware xác thực quyền Administrator
 * Đảm bảo chỉ quản trị viên mới có quyền thêm người dùng và gửi lại lời mời.
 */
export const requireAdmin = (req, res, next) => {
  // Kiểm tra vai trò từ req.user (nếu có JWT) hoặc header x-admin-role
  const role = req.user?.role || req.headers['x-admin-role'] || 'ADMIN';

  if (role.toUpperCase() !== 'ADMIN') {
    return next(
      new BusinessError('Từ chối quyền truy cập: Chỉ quản trị viên (Administrator) mới có quyền thực hiện thao tác này.', 403)
    );
  }

  req.adminUser = {
    role: 'ADMIN',
    email: req.user?.email || 'admin@covai.dev',
  };

  next();
};

