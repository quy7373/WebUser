import prisma from './prismaClient.js';

/**
 * Data Access Layer (DAL) - User Repository
 * Quản lý tương tác cơ sở dữ liệu với bảng User chính thức.
 */
class UserRepository {
  /**
   * Tạo người dùng mới trong database
   */
  async create(data, tx = prisma) {
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
   * Tìm người dùng theo email
   */
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Tìm người dùng theo ID
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Lấy danh sách toàn bộ người dùng chính thức
   */
  async findAll() {
    return await prisma.user.findMany({
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
   * Thực thi nhiều thao tác trong một Database Transaction duy nhất
   */
  async transaction(fn) {
    return await prisma.$transaction(fn);
  }
}

export default new UserRepository();
