import prisma, { prismaPrimary, prismaReplica } from './prismaClient.js';

/**
 * Data Access Layer (DAL) - User Invitation Repository
 * Chỉ lưu trữ tokenHash (SHA-256), không bao giờ lưu token thô.
 * Tách biệt Đọc (Replica) và Ghi (Primary).
 */
class InvitationRepository {
  /**
   * Tạo bản ghi lời mời mới (Ghi vào Primary)
   */
  async create(data, tx = prismaPrimary) {
    return await tx.userInvitation.create({
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
   * Tìm lời mời theo email (Đọc từ Replica)
   */
  async findByEmail(email) {
    return await prismaReplica.userInvitation.findUnique({
      where: { email },
    });
  }

  /**
   * Tìm lời mời bằng mã băm tokenHash (SHA-256) (Đọc từ Replica)
   */
  async findByTokenHash(tokenHash) {
    return await prismaReplica.userInvitation.findUnique({
      where: { tokenHash },
    });
  }

  /**
   * Cập nhật mã băm token mới và gia hạn thời gian (dùng khi resend invitation) (Ghi vào Primary)
   */
  async updateTokenAndExpiry(id, { tokenHash, expiresAt }, tx = prismaPrimary) {
    return await tx.userInvitation.update({
      where: { id },
      data: {
        tokenHash,
        expiresAt,
        status: 'PENDING',
      },
    });
  }

  /**
   * Cập nhật trạng thái của lời mời (ACCEPTED, REVOKED, EXPIRED) (Ghi vào Primary)
   */
  async updateStatus(id, status, tx = prismaPrimary) {
    return await tx.userInvitation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Tìm lời mời theo ID (Đọc từ Replica)
   */
  async findById(id) {
    return await prismaReplica.userInvitation.findUnique({
      where: { id: parseInt(id, 10) },
    });
  }

  /**
   * Lấy danh sách tất cả lời mời đang PENDING (Đọc từ Replica)
   */
  async findAllPending() {
    return await prismaReplica.userInvitation.findMany({
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
   * Xóa lời mời (Ghi vào Primary)
   */
  async delete(id, tx = prismaPrimary) {
    return await tx.userInvitation.delete({
      where: { id: parseInt(id, 10) },
    });
  }

  /**
   * Xóa tất cả lời mời theo email (Ghi vào Primary)
   */
  async deleteByEmail(email, tx = prismaPrimary) {
    return await tx.userInvitation.deleteMany({
      where: { email },
    });
  }
}

export default new InvitationRepository();
