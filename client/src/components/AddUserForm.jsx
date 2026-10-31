import React, { useState } from 'react';
import { User, Mail, Shield, PlusCircle, CheckCircle2, AlertCircle, Loader2, Send, ExternalLink } from 'lucide-react';
import { inviteUserApi } from '../services/api';

export default function AddUserForm({ onInvitationSent }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string, details?: string[], devInvitationUrl?: string }

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Họ và tên không được để trống';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Cú pháp email không hợp lệ (ví dụ: user@example.com)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // 1. Client-side Validation
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // 2. Gửi yêu cầu mời người dùng
      const result = await inviteUserApi(formData);

      setFeedback({
        type: 'success',
        message: result.message,
        devInvitationUrl: result.data?.devInvitationUrl,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'USER',
      });

      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (err) {
      // 3. Phản hồi lỗi từ Business Layer (ví dụ trùng email, format sai)
      setFeedback({
        type: 'error',
        message: err.message || 'Đã xảy ra lỗi khi tạo lời mời người dùng',
        details: err.details || [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <Send size={22} color="#6d5dfb" />
        Thêm Người Dùng (Gửi Lời Mời)
      </h2>
      <p className="card-description">
        Quản trị viên gửi lời mời tham gia CovAI. Người dùng cần xác nhận qua email và đặt mật khẩu để kích hoạt.
      </p>

      {/* Thông báo kết quả (Success / Duplicate / Validation Error) */}
      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ width: '100%' }}>
            <p style={{ fontWeight: 600 }}>{feedback.message}</p>

            {feedback.details && feedback.details.length > 0 && (
              <ul>
                {feedback.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}

            {/* Phím tắt mở link xác nhận trực tiếp cho môi trường Dev */}
            {feedback.devInvitationUrl && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #a7f3d0' }}>
                <p style={{ fontSize: '0.8rem', color: '#065f46', marginBottom: '0.35rem' }}>
                  ⚡ <strong>Kiểm thử nhanh (Môi trường Dev):</strong>
                </p>
                <a
                  href={feedback.devInvitationUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#059669',
                    color: '#ffffff',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  Mở Trang Chấp Nhận Lời Mời (/accept-invitation)
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Tên người dùng */}
        <div className="form-group">
          <label className="form-label" htmlFor="userName">
            Họ và Tên *
          </label>
          <div className="input-wrapper">
            <User size={18} className="input-icon" />
            <input
              id="userName"
              type="text"
              name="name"
              className={`form-input ${validationErrors.name ? 'error' : ''}`}
              placeholder="Ví dụ: Lê Thị Thanh"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {validationErrors.name && (
            <p className="field-error">{validationErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="userEmail">
            Địa chỉ Email *
          </label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input
              id="userEmail"
              type="email"
              name="email"
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="user@covai.dev"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {validationErrors.email && (
            <p className="field-error">{validationErrors.email}</p>
          )}
        </div>

        {/* Vai trò (Role) */}
        <div className="form-group">
          <label className="form-label" htmlFor="userRole">
            Vai trò được gán (Role)
          </label>
          <div className="input-wrapper">
            <Shield size={18} className="input-icon" />
            <select
              id="userRole"
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="USER">USER (Thành viên thông thường)</option>
              <option value="EDITOR">EDITOR (Chỉnh sửa & phát triển)</option>
              <option value="VIEWER">VIEWER (Chỉ xem báo cáo)</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
            </select>
          </div>
        </div>

        {/* Nút Submit */}
        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
          style={{ backgroundColor: '#6d5dfb' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinner" />
              Đang gửi email mời CovAI...
            </>
          ) : (
            <>
              <Send size={18} />
              Gửi Lời Mời Tham Gia CovAI
            </>
          )}
        </button>
      </form>
    </div>
  );
}
