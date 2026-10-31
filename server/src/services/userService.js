import userRepository from '../dal/userRepository.js';
import invitationRepository from '../dal/invitationRepository.js';
import emailService from './emailService.js';
import { generateToken, hashToken, validatePasswordPolicy, hashPassword } from '../utils/security.js';
import { BusinessError } from '../middlewares/errorHandler.js';

/**
 * Business Layer - User Service (CovAI User Management & Invitation Flow)
 */
class UserService {
  /**
   * Bước 1: Quản trị viên thêm người dùng mới -> Gửi email mời / xác nhận
   */
  async inviteNewUser({ name, email, role, adminUser }) {
    // 1. Kiểm tra quyền Administrator
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new BusinessError('Chỉ có quản trị viên (Admin) mới có quyền thêm người dùng mới.', 403, 'FORBIDDEN');
    }

    // 2. Validate và chuẩn hóa Email
    if (!email || typeof email !== 'string') {
      throw new BusinessError('Địa chỉ email bắt buộc phải được cung cấp.', 400, 'INVALID_EMAIL');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new BusinessError('Cú pháp email không hợp lệ (ví dụ: user@example.com).', 400, 'INVALID_EMAIL');
    }

    // 3. Validate Họ và Tên
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName || trimmedName.length < 2) {
      throw new BusinessError('Họ và tên bắt buộc và phải có ít nhất 2 ký tự.', 400, 'INVALID_NAME');
    }

    // 4. Validate Vai trò (Role)
    const allowedRoles = ['ADMIN', 'EDITOR', 'VIEWER', 'USER'];
    const assignedRole = role && allowedRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'USER';

    // 5. Kiểm tra email đã thuộc về User chính thức nào chưa
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BusinessError(`Email '${normalizedEmail}' đã thuộc về một người dùng đang hoạt động trong hệ thống.`, 409, 'USER_EXISTS');
    }

    // 6. Kiểm tra xem có lời mời đang PENDING hay không
    const existingInvitation = await invitationRepository.findByEmail(normalizedEmail);
    const now = new Date();
    if (existingInvitation && existingInvitation.status === 'PENDING' && new Date(existingInvitation.expiresAt) > now) {
      throw new BusinessError(`Một lời mời đang chờ xác nhận đã tồn tại cho email '${normalizedEmail}'. Bạn có thể sử dụng chức năng Gửi lại lời mời (Resend).`, 409, 'INVITATION_PENDING');
    }

    // 7. Tạo token ngẫu nhiên bảo mật và CHỈ LƯU MÃ BĂM SHA-256
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    if (existingInvitation) {
      // Nếu đã có lời mời cũ (hết hạn hoặc đã xong), cập nhật lại
      await invitationRepository.updateTokenAndExpiry(existingInvitation.id, {
        tokenHash,
        expiresAt,
      });
    } else {
      // Tạo lời mời mới trong bảng UserInvitation
      await invitationRepository.create({
        name: trimmedName,
        email: normalizedEmail,
        role: assignedRole,
        tokenHash,
        expiresAt,
      });
    }

    // 8. Tạo URL xác nhận trỏ tới /accept-invitation
    const clientBaseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5174';
    const invitationUrl = `${clientBaseUrl}/accept-invitation?token=${rawToken}`;

    // 9. Gửi email thương hiệu CovAI
    await emailService.sendCovAiInvitationEmail({
      to: normalizedEmail,
      name: trimmedName,
      role: assignedRole,
      invitationUrl,
      expiresAt,
    });

    return {
      message: `Đã gửi email mời tham gia CovAI đến ${normalizedEmail}. Người dùng cần xác nhận qua email để kích hoạt tài khoản.`,
      email: normalizedEmail,
      role: assignedRole,
      devInvitationUrl: invitationUrl,
    };
  }

  /**
   * Kiểm tra thông tin lời mời từ Token (cho màn hình /accept-invitation)
   */
  async inspectInvitation(token) {
    if (!token || typeof token !== 'string') {
      throw new BusinessError('Mã xác nhận (token) bị thiếu hoặc không đúng định dạng.', 400, 'INVALID_TOKEN');
    }

    const tokenHash = hashToken(token);
    const invitation = await invitationRepository.findByTokenHash(tokenHash);

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BusinessError('Mã lời mời không tồn tại hoặc đã được kích hoạt trước đó.', 404, 'INVITATION_NOT_FOUND');
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      throw new BusinessError('Mã lời mời đã hết hạn (quá 24 giờ). Vui lòng yêu cầu quản trị viên gửi lại lời mời.', 410, 'INVITATION_EXPIRED');
    }

    // Chỉ trả về thông tin an toàn cho người nhận
    return {
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Bước 2: Người dùng xác nhận lời mời & tự đặt mật khẩu (POST /api/users/accept-invitation)
   */
  async acceptInvitation({ token, password }) {
    if (!token || typeof token !== 'string') {
      throw new BusinessError('Mã token xác nhận không được để trống.', 400, 'MISSING_TOKEN');
    }

    // 1. Kiểm tra chính sách mật khẩu
    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      throw new BusinessError('Mật khẩu không thỏa mãn chính sách bảo mật.', 400, 'WEAK_PASSWORD', passwordCheck.errors);
    }

    // 2. Tìm lời mời bằng mã băm SHA-256
    const tokenHash = hashToken(token);
    const invitation = await invitationRepository.findByTokenHash(tokenHash);

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BusinessError('Mã lời mời không hợp lệ, không tồn tại hoặc đã được sử dụng.', 404, 'INVALID_OR_USED_TOKEN');
    }

    // 3. Kiểm tra thời hạn
    if (new Date() > new Date(invitation.expiresAt)) {
      throw new BusinessError('Mã lời mời đã hết hạn. Vui lòng yêu cầu quản trị viên gửi lại lời mời mới.', 410, 'EXPIRED_TOKEN');
    }

    // 4. Băm mật khẩu người dùng
    const passwordHash = await hashPassword(password);

    // 5. Thực hiện lưu vào database ATOMICALLY (Prisma Transaction)
    const newUser = await userRepository.transaction(async (tx) => {
      // 5.1. Tạo người dùng chính thức trong bảng User
      const createdUser = await userRepository.create(
        {
          name: invitation.name,
          email: invitation.email,
          role: invitation.role, // Vai trò lấy CHÍNH XÁC từ lời mời gốc, không tin tưởng client
          passwordHash: passwordHash,
          isVerified: true,
        },
        tx
      );

      // 5.2. Đánh dấu vô hiệu hóa lời mời (chống dùng lại token)
      await invitationRepository.updateStatus(invitation.id, 'ACCEPTED', tx);

      return createdUser;
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified,
    };
  }

  /**
   * Bước 3: Quản trị viên gửi lại lời mời (POST /api/users/resend-invitation)
   */
  async resendInvitation({ email, adminUser }) {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new BusinessError('Chỉ có quản trị viên mới có quyền gửi lại lời mời.', 403, 'FORBIDDEN');
    }

    if (!email || typeof email !== 'string') {
      throw new BusinessError('Vui lòng cung cấp email của lời mời cần gửi lại.', 400, 'INVALID_EMAIL');
    }
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Kiểm tra xem người dùng đã là thành viên chính thức chưa
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BusinessError('Người dùng này đã kích hoạt tài khoản thành công, không thể gửi lại lời mời.', 400, 'USER_ALREADY_ACTIVE');
    }

    // 2. Tìm lời mời PENDING
    const invitation = await invitationRepository.findByEmail(normalizedEmail);
    if (!invitation || invitation.status !== 'PENDING') {
      throw new BusinessError('Không tìm thấy lời mời đang chờ xử lý cho email này.', 404, 'INVITATION_NOT_FOUND');
    }

    // 3. Sinh token mới, băm SHA-256 và gia hạn 24 giờ
    const newRawToken = generateToken();
    const newTokenHash = hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Cập nhật DAL (token cũ lập tức bị vô hiệu hóa)
    await invitationRepository.updateTokenAndExpiry(invitation.id, {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    // 4. Gửi lại email mời mới
    const clientBaseUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5174';
    const invitationUrl = `${clientBaseUrl}/accept-invitation?token=${newRawToken}`;

    await emailService.sendCovAiInvitationEmail({
      to: normalizedEmail,
      name: invitation.name,
      role: invitation.role,
      invitationUrl,
      expiresAt: newExpiresAt,
    });

    return {
      message: `Đã gửi lại email mời thành công tới ${normalizedEmail}.`,
      email: normalizedEmail,
      devInvitationUrl: invitationUrl,
    };
  }

  /**
   * Lấy danh sách các lời mời đang chờ (Pending)
   */
  async getPendingInvitations() {
    return await invitationRepository.findAllPending();
  }

  /**
   * Lấy danh sách toàn bộ người dùng chính thức đã kích hoạt
   */
  async getAllUsers() {
    return await userRepository.findAll();
  }
}

export default new UserService();
