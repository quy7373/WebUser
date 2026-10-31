import userService from '../services/userService.js';

/**
 * Controller xử lý các Request liên quan đến User và Invitation
 */
class UserController {
  /**
   * POST /api/users
   * Quản trị viên mời người dùng mới
   */
  async inviteUser(req, res, next) {
    try {
      const { name, email, role } = req.body;
      const result = await userService.inviteNewUser({
        name,
        email,
        role,
        adminUser: req.adminUser,
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/invitation?token=... hoặc POST /api/users/inspect-invitation
   * Kiểm tra thông tin lời mời trước khi hiển thị form tạo mật khẩu
   */
  async inspectInvitation(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      const invitation = await userService.inspectInvitation(token);

      return res.status(200).json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/accept-invitation
   * Người dùng xác nhận lời mời và tự thiết lập mật khẩu
   */
  async acceptInvitation(req, res, next) {
    try {
      const { token, password } = req.body;
      const newUser = await userService.acceptInvitation({ token, password });

      return res.status(201).json({
        success: true,
        message: 'Xác nhận lời mời thành công! Tài khoản của bạn đã được kích hoạt.',
        data: newUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/resend-invitation
   * Quản trị viên gửi lại lời mời
   */
  async resendInvitation(req, res, next) {
    try {
      const { email } = req.body;
      const result = await userService.resendInvitation({
        email,
        adminUser: req.adminUser,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users
   * Danh sách người dùng chính thức đã được lưu trong DB
   */
  async getUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/invitations
   * Danh sách các lời mời đang chờ (Pending)
   */
  async getInvitations(req, res, next) {
    try {
      const invitations = await userService.getPendingInvitations();
      return res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
