const API_BASE_URL = 'http://localhost:5001/api';

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-admin-role': 'ADMIN',
};

/**
 * 1. Admin mời người dùng mới (POST /api/users)
 */
export async function inviteUserApi(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Lỗi khi gửi lời mời người dùng');
    error.status = response.status;
    error.details = data.errors || [];
    throw error;
  }
  return data;
}

/**
 * 2. Kiểm tra thông tin lời mời từ Token (GET /api/users/invitation?token=...)
 */
export async function inspectInvitationApi(token) {
  const response = await fetch(`${API_BASE_URL}/users/invitation?token=${encodeURIComponent(token)}`);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Lời mời không hợp lệ hoặc đã hết hạn');
    error.status = response.status;
    throw error;
  }
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

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Xác nhận lời mời thất bại');
    error.status = response.status;
    error.details = data.errors || [];
    throw error;
  }
  return data;
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

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Không thể gửi lại lời mời');
    error.status = response.status;
    throw error;
  }
  return data;
}

/**
 * 5. Lấy danh sách lời mời đang chờ (GET /api/users/invitations)
 */
export async function getPendingInvitationsApi() {
  const response = await fetch(`${API_BASE_URL}/users/invitations`, {
    headers: adminHeaders,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách lời mời');
  }
  return data.data || [];
}

/**
 * 6. Lấy danh sách người dùng chính thức đã kích hoạt (GET /api/users)
 */
export async function getUsersApi() {
  const response = await fetch(`${API_BASE_URL}/users`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách người dùng');
  }
  return data.data || [];
}
