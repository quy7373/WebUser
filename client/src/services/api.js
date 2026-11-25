const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-admin-role': 'ADMIN',
};

/**
 * Xử lý response an toàn: tự động phân biệt JSON và HTML (khi Nginx trả về lỗi 502/503/504)
 */
async function handleResponse(response, defaultError = 'Đã có lỗi xảy ra') {
  const text = await response.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    // Nếu phản hồi là HTML (ví dụ Nginx trả về trang lỗi 502/503/504)
    if (response.status === 502) {
      throw new Error('502 Bad Gateway: Không thể kết nối tới các máy chủ Backend.');
    }
    if (response.status === 503) {
      throw new Error('503 Service Unavailable: Cụm máy chủ đang bận hoặc bảo trì.');
    }
    if (response.status === 504) {
      throw new Error('504 Gateway Timeout: Cụm máy chủ phản hồi quá lâu.');
    }
    throw new Error(`Lỗi máy chủ (${response.status}): ${text.slice(0, 150)}`);
  }

  if (!response.ok) {
    const error = new Error(data?.message || defaultError);
    error.status = response.status;
    error.details = data?.errors || [];
    throw error;
  }

  return data;
}

/**
 * 1. Admin mời người dùng mới (POST /api/users)
 */
export async function inviteUserApi(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(userData),
  });

  return await handleResponse(response, 'Lỗi khi gửi lời mời người dùng');
}

/**
 * 2. Kiểm tra thông tin lời mời từ Token (GET /api/users/invitation?token=...)
 */
export async function inspectInvitationApi(token) {
  const response = await fetch(`${API_BASE_URL}/users/invitation?token=${encodeURIComponent(token)}`);
  const data = await handleResponse(response, 'Lời mời không hợp lệ hoặc đã hết hạn');
  return data.data;
}

/**
 * 3. Chấp nhận lời mời và đặt mật khẩu (POST /api/users/accept-invitation)
 */
export async function acceptInvitationApi({ token, password }) {
  const response = await fetch(`${API_BASE_URL}/users/accept-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  return await handleResponse(response, 'Xác nhận lời mời thất bại');
}

/**
 * 4. Quản trị viên gửi lại lời mời (POST /api/users/resend-invitation)
 */
export async function resendInvitationApi(email) {
  const response = await fetch(`${API_BASE_URL}/users/resend-invitation`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email }),
  });

  return await handleResponse(response, 'Không thể gửi lại lời mời');
}

/**
 * 5. Lấy danh sách lời mời đang chờ (GET /api/users/invitations)
 */
export async function getPendingInvitationsApi() {
  const response = await fetch(`${API_BASE_URL}/users/invitations`, {
    headers: adminHeaders,
  });

  const data = await handleResponse(response, 'Không thể tải danh sách lời mời');
  return data.data || [];
}

/**
 * 6. Lấy danh sách người dùng chính thức đã kích hoạt (hỗ trợ tìm kiếm theo tên và ngày tạo dd/mm/yy)
 */
export async function getUsersApi({ name, date } = {}) {
  const params = new URLSearchParams();
  if (name && name.trim()) params.append('name', name.trim());
  if (date && date.trim()) params.append('date', date.trim());

  const queryString = params.toString();
  const url = queryString ? `${API_BASE_URL}/users?${queryString}` : `${API_BASE_URL}/users`;

  const response = await fetch(url);
  const data = await handleResponse(response, 'Không thể tải danh sách người dùng');
  return data.data || [];
}

/**
 * 7. Quản trị viên xóa người dùng chính thức (DELETE /api/users/:id)
 */
export async function deleteUserApi(id) {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });

  return await handleResponse(response, 'Không thể xóa người dùng');
}

/**
 * 8. Quản trị viên xóa / hủy lời mời đang chờ (DELETE /api/users/invitations/:id)
 */
export async function deleteInvitationApi(id) {
  const response = await fetch(`${API_BASE_URL}/users/invitations/${id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });

  return await handleResponse(response, 'Không thể hủy lời mời');
}
