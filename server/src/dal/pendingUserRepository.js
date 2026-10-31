import prisma from './prismaClient.js';

/**
 * Data Access Layer (DAL) - PendingUser Repository
 * Quản lý lưu trữ thông tin đăng ký tạm và token xác nhận qua email.
 */
class PendingUserRepository {
  /**
   * Tạo mới hoặc cập nhật bản ghi PendingUser (nếu email đã từng yêu cầu trước đó)
   * @param {Object} data - { email, name, role, token, expiresAt }
   * @returns {Promise<Object>}
   */
  async upsertPending(data) {
    return await prisma.pendingUser.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      create: {
        email: data.email,
        name: data.name,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Tìm bản ghi PendingUser theo token xác nhận
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  async findByToken(token) {
    return await prisma.pendingUser.findUnique({
      where: { token },
    });
  }

  /**
   * Tìm bản ghi PendingUser theo email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return await prisma.pendingUser.findUnique({
      where: { email },
    });
  }

  /**
   * Xóa bản ghi PendingUser sau khi đã xác nhận thành công
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async deleteByToken(token) {
    return await prisma.pendingUser.delete({
      where: { token },
    });
  }
}

export default new PendingUserRepository();

