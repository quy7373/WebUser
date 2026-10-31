import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Sinh token ngẫu nhiên bảo mật cao (64 ký tự hex)
 * @returns {string}
 */
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Băm token bằng giải thuật SHA-256 (chỉ lưu hash vào cơ sở dữ liệu)
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token provided for hashing');
  }
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Thoát các ký tự đặc biệt trong chuỗi để bảo vệ chống XSS / HTML Injection trong email
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

/**
 * Chính sách kiểm tra mật khẩu:
 * - Tối thiểu 8 ký tự
 * - Có ít nhất 1 chữ cái
 * - Có ít nhất 1 chữ số
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePasswordPolicy(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Mật khẩu không được để trống.'] };
  }
  if (password.length < 8) {
    errors.push('Mật khẩu phải có độ dài tối thiểu 8 ký tự.');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ cái.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ số.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Băm mật khẩu bằng thuật toán Bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * So khớp mật khẩu với mã băm
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

