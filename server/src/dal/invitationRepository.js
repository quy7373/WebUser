import prisma from './prismaClient.js';

/**
 * Data Access Layer (DAL) - User Invitation Repository
 * Chỉ lưu trữ tokenHash (SHA-256), không bao giờ lưu token thô.
 */
class InvitationRepository {
  /**
   * Tạo bản ghi lời mời mới
   */
  async create(data) {
    return await prisma.userInvitation.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        tokenHash: data.tokenHash,
        status: 'PENDING',
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Tìm lời mời theo email
   */
  async findByEmail(email) {
    return await prisma.userInvitation.findUnique({
      where: { email },
    });
  }

  /**
   * Tìm lời mời bằng mã băm tokenHash (SHA-256)
   */
  async findByTokenHash(tokenHash) {
    return await prisma.userInvitation.findUnique({
      where: { tokenHash },
    });
  }

  /**
   * Cập nhật mã băm token mới và gia hạn thời gian (dùng khi resend invitation)
   */
  async updateTokenAndExpiry(id, { tokenHash, expiresAt }) {
    return await prisma.userInvitation.update({
      where: { id },
      data: {
        tokenHash,
        expiresAt,
        status: 'PENDING',
      },
    });
  }

  /**
   * Cập nhật trạng thái của lời mời (ACCEPTED, REVOKED, EXPIRED)
   */
  async updateStatus(id, status, tx = prisma) {
    return await tx.userInvitation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Lấy danh sách tất cả lời mời đang PENDING
   */
  async findAllPending() {
    return await prisma.userInvitation.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Xóa lời mời
   */
  async delete(id, tx = prisma) {
    return await tx.userInvitation.delete({
      where: { id },
    });
  }
}

export default new InvitationRepository();

