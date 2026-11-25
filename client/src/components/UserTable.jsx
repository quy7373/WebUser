import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  ShieldCheck,
  Mail,
  Hash,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Search,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { deleteUserApi, getUsersApi } from '../services/api';

export default function UserTable({ users, loading, onRefresh }) {
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Search & Filter State
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [activeFilter, setActiveFilter] = useState({ name: '', date: '' });
  const [filteredUsers, setFilteredUsers] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const hasActiveFilter = Boolean(activeFilter.name || activeFilter.date);
  const displayedUsers = filteredUsers !== null ? filteredUsers : users;

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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-admin';
      case 'EDITOR':
        return 'badge-editor';
      case 'VIEWER':
        return 'badge-viewer';
      default:
        return 'badge-user';
    }
  };

  const executeSearch = async (name, date, showLoading = true) => {
    const trimmedName = (name || '').trim();
    const trimmedDate = (date || '').trim();

    if (!trimmedName && !trimmedDate) {
      setActiveFilter({ name: '', date: '' });
      setFilteredUsers(null);
      setSearchError(null);
      return;
    }

    if (showLoading) setIsSearching(true);
    setSearchError(null);

    try {
      const results = await getUsersApi({ name: trimmedName, date: trimmedDate });
      setFilteredUsers(results);
      setActiveFilter({ name: trimmedName, date: trimmedDate });
    } catch (err) {
      setSearchError(err.message || 'Lỗi khi tìm kiếm người dùng.');
    } finally {
      if (showLoading) setIsSearching(false);
    }
  };

  // Tự động đồng bộ kết quả tìm kiếm khi danh sách users gốc thay đổi (ví dụ sau khi thêm/xóa)
  useEffect(() => {
    if (activeFilter.name || activeFilter.date) {
      executeSearch(activeFilter.name, activeFilter.date, false);
    } else {
      setFilteredUsers(null);
    }
  }, [users]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(searchName, searchDate, true);
  };

  const handleClearSearch = () => {
    setSearchName('');
    setSearchDate('');
    setActiveFilter({ name: '', date: '' });
    setFilteredUsers(null);
    setSearchError(null);
    if (onRefresh) onRefresh();
  };

  const handleRemoveFilterName = () => {
    setSearchName('');
    executeSearch('', activeFilter.date, true);
  };

  const handleRemoveFilterDate = () => {
    setSearchDate('');
    executeSearch(activeFilter.name, '', true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const response = await deleteUserApi(userToDelete.id);
      setStatusMessage({
        type: 'success',
        text: response.message || `Đã xóa người dùng "${userToDelete.name}" thành công.`,
      });
      setUserToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi xóa người dùng khỏi hệ thống.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h2 className="card-title">
          <Users size={22} color="#4f46e5" />
          Danh Sách Người Dùng ({displayedUsers.length}{hasActiveFilter && ` / ${users.length}`})
        </h2>
        <button
          onClick={() => {
            if (hasActiveFilter) {
              executeSearch(activeFilter.name, activeFilter.date, true);
            }
            if (onRefresh) onRefresh();
          }}
          disabled={loading || isSearching}
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
          {loading || isSearching ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <p className="card-description">
        Dữ liệu được lưu trữ trong PostgreSQL và truy xuất qua Data Access Layer (Prisma).
      </p>

      {/* Thanh Tìm Kiếm & Lọc (Search & Filter) */}
      <div className="search-filter-container">
        <form onSubmit={handleSearchSubmit} className="search-filter-form">
          <div className="search-field-group">
            <Search size={15} className="search-field-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo tên người dùng..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="search-field-group date-field">
            <Calendar size={15} className="search-field-icon" />
            <input
              type="text"
              className={`search-input ${searchError ? 'has-error' : ''}`}
              placeholder="Ngày tạo (dd/mm/yy)..."
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                if (searchError) setSearchError(null);
              }}
              title="Nhập theo định dạng dd/mm/yy (ví dụ: 31/10/26 hoặc 31/10/2026)"
            />
          </div>

          <div className="search-buttons">
            <button type="submit" className="btn-search" disabled={isSearching}>
              {isSearching ? <Loader2 size={14} className="spinner" /> : <Filter size={14} />}
              Tìm kiếm
            </button>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn-clear-search"
                title="Xóa bộ lọc tìm kiếm"
              >
                <RotateCcw size={14} />
                Đặt lại
              </button>
            )}
          </div>
        </form>

        {/* Cảnh báo lỗi định dạng ngày nếu có */}
        {searchError && (
          <div className="search-error-hint">
            <AlertTriangle size={14} />
            <span>{searchError}</span>
          </div>
        )}

        {/* Chips hiển thị các điều kiện lọc đang kích hoạt */}
        {hasActiveFilter && (
          <div className="active-filter-chips">
            <span>Đang lọc:</span>
            {activeFilter.name && (
              <span className="filter-chip">
                Tên: <strong>"{activeFilter.name}"</strong>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemoveFilterName}
                  title="Bỏ lọc tên"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {activeFilter.date && (
              <span className="filter-chip">
                Ngày tạo: <strong>"{activeFilter.date}"</strong>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={handleRemoveFilterDate}
                  title="Bỏ lọc ngày tạo"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.775rem', color: '#64748b' }}>
              Tìm thấy {displayedUsers.length} kết quả
            </span>
          </div>
        )}
      </div>

      {/* Thông báo trạng thái xóa */}
      {statusMessage && (
        <div
          className={`alert ${statusMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '0.2rem',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {displayedUsers.length === 0 ? (
        <div className="empty-state">
          <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          {hasActiveFilter ? (
            <div>
              <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                Không tìm thấy người dùng phù hợp
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Không có người dùng nào khớp với điều kiện tìm kiếm hiện tại.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn-clear-search"
                style={{ margin: '0 auto' }}
              >
                <RotateCcw size={14} /> Xóa bộ lọc
              </button>
            </div>
          ) : (
            <p>Chưa có người dùng nào. Hãy thêm người dùng đầu tiên qua biểu mẫu!</p>
          )}
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
                <th style={{ textAlign: 'center', width: '80px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>#{user.id}</td>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ color: '#334155' }}>{user.email}</td>
                  <td>
                    <span className={`badge-role ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-action-delete"
                      title={`Xóa người dùng ${user.name}`}
                      onClick={() => setUserToDelete(user)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Xác Nhận Xóa */}
      {userToDelete && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setUserToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-warning">
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <h3 className="modal-title">Xác nhận xóa người dùng</h3>
            </div>

            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa vĩnh viễn người dùng <strong>{userToDelete.name}</strong> không?
              </p>

              <div className="user-delete-preview">
                <div>
                  <strong>Email:</strong> {userToDelete.email}
                </div>
                <div>
                  <strong>Vai trò:</strong> {userToDelete.role}
                </div>
                <div>
                  <strong>ID:</strong> #{userToDelete.id}
                </div>
              </div>

              <div className="modal-warning-text">
                ⚠️ Thao tác này sẽ xóa vĩnh viễn người dùng khỏi cơ sở dữ liệu và không thể khôi phục.
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
