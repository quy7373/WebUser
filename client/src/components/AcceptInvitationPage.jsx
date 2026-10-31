import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  Shield,
  Mail,
  Sparkles,
} from 'lucide-react';
import { inspectInvitationApi, acceptInvitationApi } from '../services/api';

export default function AcceptInvitationPage({ token, onBackToHome }) {
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [errorState, setErrorState] = useState(null); // { message, code }

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [activatedUser, setActivatedUser] = useState(null);

  // 1. Kiểm tra mã lời mời từ Token khi load trang
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorState({
        message: 'Không tìm thấy mã lời mời (token) trên đường dẫn liên kết.',
      });
      return;
    }

    const checkToken = async () => {
      try {
        const data = await inspectInvitationApi(token);
        setInvitation(data);
      } catch (err) {
        setErrorState({
          message: err.message || 'Mã lời mời không hợp lệ hoặc đã hết hạn.',
          status: err.status,
        });
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  // Kiểm tra điều kiện mật khẩu thời gian thực
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber && isMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isPasswordValid) {
      setSubmitError('Vui lòng hoàn thành tất cả các yêu cầu mật khẩu bên dưới.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await acceptInvitationApi({ token, password });
      setActivatedUser(response.data);
    } catch (err) {
      setSubmitError(err.message || 'Không thể kích hoạt tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      {/* CovAI Branding Header */}
      <div
        style={{
          backgroundColor: '#10151d',
          padding: '20px 28px',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: '#6d5dfb',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &gt;_
        </div>
        <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
          CovAI
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#94a3b8',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Invitation Portal
        </span>
      </div>

      <div
        className="card"
        style={{
          borderRadius: '0 0 16px 16px',
          borderTop: 'none',
          padding: '2rem',
        }}
      >
        {/* State 1: Đang tải thông tin */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Loader2 size={42} className="spinner" style={{ color: '#6d5dfb', margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Đang xác thực lời mời CovAI...
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Hệ thống đang kiểm tra tính hợp lệ của mã xác nhận và thời hạn hiệu lực.
            </p>
          </div>
        )}

        {/* State 2: Lỗi mã lời mời không hợp lệ / hết hạn */}
        {!loading && errorState && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={32} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.75rem' }}>
              Lời Mời Không Khả Dụng
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {errorState.message}
            </p>
            <button onClick={onBackToHome} className="btn-submit" style={{ width: 'auto', margin: '0 auto' }}>
              Quay Về Trang Chủ
            </button>
          </div>
        )}

        {/* State 3: Kích hoạt thành công */}
        {!loading && activatedUser && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={36} color="#059669" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>
              Kích Hoạt Tài Khoản Thành Công! <Sparkles size={20} color="#f59e0b" />
            </h3>
            <p style={{ color: '#475569', fontSize: '0.925rem', marginBottom: '1.5rem' }}>
              Chào mừng bạn gia nhập <strong>CovAI</strong>. Tài khoản của bạn đã được xác minh email và lưu vĩnh viễn vào hệ thống.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                textAlign: 'left',
                marginBottom: '1.75rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <UserCheck size={18} color="#6d5dfb" />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Hồ sơ tài khoản:</span>
              </div>
              <p><strong>Họ và tên:</strong> {activatedUser.name}</p>
              <p><strong>Email:</strong> {activatedUser.email}</p>
              <p>
                <strong>Vai trò được cấp:</strong>{' '}
                <span className="badge-role badge-admin" style={{ background: '#f5f3ff', color: '#6d5dfb', borderColor: '#ddd6fe' }}>
                  {activatedUser.role}
                </span>
              </p>
            </div>

            <button
              onClick={onBackToHome}
              className="btn-submit"
              style={{ backgroundColor: '#6d5dfb', width: 'auto', margin: '0 auto' }}
            >
              Đăng Nhập Ngay <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 4: Form thiết lập mật khẩu khi token hợp lệ */}
        {!loading && invitation && !activatedUser && !errorState && (
          <div>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <span style={{ color: '#6d5dfb', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                BƯỚC CUỐI CÙNG
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0.35rem 0 0.5rem' }}>
                Thiết Lập Mật Khẩu CovAI
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Xin chào <strong>{invitation.name}</strong>, vui lòng tạo mật khẩu để hoàn tất kích hoạt tài khoản.
              </p>
            </div>

            {/* Thẻ thông tin lời mời (Read-only) */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                  <Mail size={15} /> Email được mời:
                </span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{invitation.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                  <Shield size={15} /> Vai trò được gán:
                </span>
                <span className="badge-role" style={{ background: '#f5f3ff', color: '#6d5dfb', borderColor: '#ddd6fe' }}>
                  {invitation.role}
                </span>
              </div>
            </div>

            {submitError && (
              <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Mật khẩu mới */}
              <div className="form-group">
                <label className="form-label">Mật khẩu mới *</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Nhập ít nhất 8 ký tự (chữ + số)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu *</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Checklist chính sách bảo mật mật khẩu */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Yêu cầu mật khẩu:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span style={{ color: hasMinLength ? '#059669' : '#94a3b8' }}>
                    {hasMinLength ? '✓' : '○'} Tối thiểu 8 ký tự
                  </span>
                  <span style={{ color: hasLetter ? '#059669' : '#94a3b8' }}>
                    {hasLetter ? '✓' : '○'} Chứa ít nhất 1 chữ cái
                  </span>
                  <span style={{ color: hasNumber ? '#059669' : '#94a3b8' }}>
                    {hasNumber ? '✓' : '○'} Chứa ít nhất 1 chữ số
                  </span>
                  <span style={{ color: isMatch ? '#059669' : '#94a3b8' }}>
                    {isMatch ? '✓' : '○'} Mật khẩu trùng khớp
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-submit"
                disabled={!isPasswordValid || submitting}
                style={{ backgroundColor: '#6d5dfb' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    <UserCheck size={18} />
                    Xác Nhận & Kích Hoạt Tài Khoản
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

