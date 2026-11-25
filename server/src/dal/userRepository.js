import prisma, { prismaPrimary, prismaReplica } from './prismaClient.js';

/**
 * Data Access Layer (DAL) - User Repository
 * Quản lý tương tác cơ sở dữ liệu với bảng User chính thức.
 * Hỗ trợ tách biệt Đọc (Replica) và Ghi (Primary).
 */
class UserRepository {
  /**
   * Tạo người dùng mới trong database (Ghi vào Primary)
   */
  async create(data, tx = prismaPrimary) {
    return await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role || 'USER',
        passwordHash: data.passwordHash || null,
        isVerified: data.isVerified !== undefined ? data.isVerified : true,
      },
    });
  }

  /**
   * Tìm người dùng theo email (Đọc từ Replica)
   */
  async findByEmail(email) {
    return await prismaReplica.user.findUnique({
      where: { email },
    });
  }

  /**
   * Tìm người dùng theo ID (Đọc từ Replica)
   */
  async findById(id) {
    return await prismaReplica.user.findUnique({
      where: { id: parseInt(id, 10) },
    });
  }

  /**
   * Lấy danh sách toàn bộ người dùng chính thức (Đọc từ Replica)
   */
  async findAll({ name, startDate, endDate } = {}) {
    const where = {};

    if (name && typeof name === 'string' && name.trim()) {
      where.name = {
        contains: name.trim(),
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return await prismaReplica.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Xóa người dùng theo ID (Ghi vào Primary)
   */
  async delete(id, tx = prismaPrimary) {
    return await tx.user.delete({
      where: { id: parseInt(id, 10) },
    });
  }

  /**
   * Thực thi nhiều thao tác trong một Database Transaction duy nhất (Chạy trên Primary)
   */
  async transaction(fn) {
    return await prismaPrimary.$transaction(fn);
  }
}

export default new UserRepository();
