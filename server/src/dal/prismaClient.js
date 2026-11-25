import { PrismaClient } from '@prisma/client';

/**
 * Quản lý kết nối Database đa tầng (Primary Write - Replica Read)
 */

// 1. Kết nối Primary (Master): Nhận mọi thao tác Ghi (INSERT, UPDATE, DELETE, Transactions)
export const prismaPrimary = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 2. Kết nối Replica (Standby): Phục vụ các truy vấn Đọc (SELECT) giảm tải cho Primary
// Nếu không cấu hình DATABASE_REPLICA_URL, tự động fallback về Primary
export const prismaReplica = process.env.DATABASE_REPLICA_URL
  ? new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_REPLICA_URL,
        },
      },
    })
  : prismaPrimary;

// Export mặc định giữ tương thích với các module cũ
const prisma = prismaPrimary;
export default prisma;
