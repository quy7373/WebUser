/**
 * Rate Limiter đơn giản và hiệu quả theo Sliding Window / Memory Store
 */
class MemoryRateLimiter {
  constructor(windowMs, maxRequests, message) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.message = message;
    this.records = new Map();
  }

  middleware(keyExtractor) {
    return (req, res, next) => {
      const key = keyExtractor ? keyExtractor(req) : (req.ip || 'global');
      const now = Date.now();
      const userRecord = this.records.get(key) || [];

      // Lọc các timestamp trong cửa sổ thời gian
      const validTimestamps = userRecord.filter((timestamp) => now - timestamp < this.windowMs);

      if (validTimestamps.length >= this.maxRequests) {
        const oldestTime = validTimestamps[0];
        const waitSeconds = Math.ceil((oldestTime + this.windowMs - now) / 1000);
        res.setHeader('Retry-After', waitSeconds);
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: `${this.message} Vui lòng thử lại sau ${waitSeconds} giây.`,
        });
      }

      validTimestamps.push(now);
      this.records.set(key, validTimestamps);
      next();
    };
  }
}

// Giới hạn gửi lại lời mời: tối đa 1 lần mỗi 30 giây theo email
export const resendRateLimiter = new MemoryRateLimiter(
  30 * 1000,
  1,
  'Bạn thao tác quá nhanh khi gửi lại lời mời.'
).middleware((req) => `resend:${(req.body?.email || req.ip || '').toLowerCase()}`);

// Giới hạn thử nghiệm chấp nhận token: tối đa 10 lần mỗi 5 phút theo IP để chống brute force
export const acceptRateLimiter = new MemoryRateLimiter(
  5 * 60 * 1000,
  10,
  'Quá nhiều lần thử nghiệm xác thực không thành công.'
).middleware((req) => `accept:${req.ip}`);

