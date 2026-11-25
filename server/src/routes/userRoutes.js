import { Router } from 'express';
import userController from '../controllers/userController.js';
import { requireAdmin } from '../middlewares/adminAuth.js';
import { resendRateLimiter, acceptRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

// 1. Quản trị viên thêm người dùng mới (gửi email mời CovAI)
router.post('/users', requireAdmin, userController.inviteUser);
router.post('/users/invite', requireAdmin, userController.inviteUser);

// 2. Kiểm tra thông tin lời mời từ token (không yêu cầu login)
router.get('/users/invitation', userController.inspectInvitation);
router.post('/users/inspect-invitation', userController.inspectInvitation);

// 3. Người dùng xác nhận lời mời & thiết lập mật khẩu (POST /api/users/accept-invitation)
router.post('/users/accept-invitation', acceptRateLimiter, userController.acceptInvitation);

// 4. Quản trị viên gửi lại lời mời (POST /api/users/resend-invitation, có rate limit)
router.post('/users/resend-invitation', requireAdmin, resendRateLimiter, userController.resendInvitation);

// 5. Lấy danh sách người dùng chính thức đã kích hoạt
router.get('/users', userController.getUsers);

// 6. Lấy danh sách lời mời đang chờ (Pending)
router.get('/users/invitations', requireAdmin, userController.getInvitations);

// 7. Hủy / Xóa lời mời đang chờ (DELETE /api/users/invitations/:id)
router.delete('/users/invitations/:id', requireAdmin, userController.deleteInvitation);

// 8. Quản trị viên xóa người dùng chính thức (DELETE /api/users/:id)
router.delete('/users/:id', requireAdmin, userController.deleteUser);

export default router;
