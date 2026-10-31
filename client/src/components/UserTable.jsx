import React from 'react';
import { Users, Calendar, ShieldCheck, Mail, Hash } from 'lucide-react';

export default function UserTable({ users, loading, onRefresh }) {
  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h2 className="card-title">
          <Users size={22} color="#4f46e5" />
          Danh Sách Người Dùng ({users.length})
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#4f46e5',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>
      <p className="card-description">
        Dữ liệu được lưu trữ trong PostgreSQL và truy xuất qua Data Access Layer (Prisma).
      </p>

      {users.length === 0 ? (
        <div className="empty-state">
          <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <p>Chưa có người dùng nào. Hãy thêm người dùng đầu tiên qua biểu mẫu!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={14} /> ID
                  </span>
                </th>
                <th>Tên người dùng</th>
                <th>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={14} /> Email
                  </span>
                </th>
                <th>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Vai trò
                  </span>
                </th>
                <th>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Ngày tạo
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>#{user.id}</td>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ color: '#334155' }}>{user.email}</td>
                  <td>
                    <span
                      className={`badge-role ${
                        user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

