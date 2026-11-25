import { BusinessError } from '../middlewares/errorHandler.js';

/**
 * Phân tích chuỗi ngày theo định dạng dd/mm/yy hoặc dd/mm/yyyy
 * Hỗ trợ các phân tách '/', '-', '.'
 * Ví dụ: 31/10/26, 31/10/2026, 05/02/26, 5/2/26
 *
 * @param {string} dateStr Chuỗi ngày người dùng nhập
 * @returns {{ startDate: Date, endDate: Date, formattedDate: string } | null}
 */
export function parseDateDdMmYy(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Regex kiểm tra định dạng dd/mm/yy hoặc dd/mm/yyyy
  const match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (!match) {
    throw new BusinessError(
      `Định dạng ngày '${trimmed}' không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yy (ví dụ: 31/10/26 hoặc 31/10/2026).`,
      400,
      'INVALID_DATE_FORMAT'
    );
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);

  // Xử lý năm 2 chữ số (ví dụ: 26 -> 2026, 99 -> 1999)
  if (year < 100) {
    year = year <= 50 ? 2000 + year : 1900 + year;
  }

  if (month < 1 || month > 12) {
    throw new BusinessError(
      `Tháng ${month} không hợp lệ (tháng phải từ 01 đến 12).`,
      400,
      'INVALID_DATE_MONTH'
    );
  }

  // Số ngày tối đa trong tháng đó
  const maxDaysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDaysInMonth) {
    throw new BusinessError(
      `Ngày ${day} không hợp lệ trong tháng ${month}/${year} (tháng này chỉ có tối đa ${maxDaysInMonth} ngày).`,
      400,
      'INVALID_DATE_DAY'
    );
  }

  // Đầu ngày: 00:00:00.000 theo múi giờ địa phương
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  // Cuối ngày: 23:59:59.999 theo múi giờ địa phương
  const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  return {
    startDate,
    endDate,
    formattedDate,
  };
}

