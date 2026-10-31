import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { confirmUserApi } from '../services/api';

export default function ConfirmEmail({ token, onBackToHome }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Không tìm thấy mã xác nhận (token) trong liên kết.');
      return;
    }

    const doConfirm = async () => {
      try {
        const response = await confirmUserApi(token);
        setUser(response.data);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'Mã xác nhận không hợp lệ hoặc đã hết hạn.');
      }
    };

    doConfirm();
  }, [token]);

  return (
    <div className="card" style={{ maxWidth: '540px', margin: '2rem auto', textAlign: 'center' }}>
      {status === 'loading' && (
        <div style={{ padding: '2rem 1rem' }}>
          <Loader2 size={44} className="spinner" style={{ color: '#4f46e5', margin: '0 auto 1.5rem' }} />
          <h2 className="card-title" style={{ justifyContent: 'center' }}>
            Đang Xác Thực Tài Khoản...
          </h2>
          <p className="card-description">
            Đang kiểm tra token và lưu thông tin người dùng vào cơ sở dữ liệu PostgreSQL.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div style={{ padding: '1rem' }}>
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

          <h2 className="card-title" style={{ justifyContent: 'center', fontSize: '1.4rem' }}>
            Xác Nhận Thành Công! <Sparkles size={20} color="#f59e0b" />
          </h2>
          <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0.5rem 0 1.5rem' }}>
            Người dùng đã được xác thực qua email và <strong>lưu chính thức vào cơ sở dữ liệu</strong>.
          </p>

          {user && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <UserCheck size={18} color="#4f46e5" />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Thông tin đã lưu:</span>
              </div>
              <p><strong>ID:</strong> #{user.id}</p>
              <p><strong>Họ và tên:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p>
                <strong>Vai trò:</strong>{' '}
                <span className={`badge-role ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                  {user.role}
                </span>
              </p>
            </div>
          )}

          <button
            onClick={onBackToHome}
            className="btn-submit"
            style={{ display: 'inline-flex', width: 'auto', padding: '0.75rem 1.75rem' }}
          >
            <ArrowLeft size={18} />
            Quay Về Trang Chủ
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertTriangle size={36} color="#dc2626" />
          </div>

          <h2 className="card-title" style={{ justifyContent: 'center', color: '#991b1b', fontSize: '1.35rem' }}>
            Xác Thực Thất Bại
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.925rem', margin: '0.5rem 0 1.5rem' }}>
            {errorMessage}
          </p>

          <button
            onClick={onBackToHome}
            className="btn-submit"
            style={{ display: 'inline-flex', width: 'auto', padding: '0.75rem 1.75rem' }}
          >
            <ArrowLeft size={18} />
            Quay Lại Trang Đăng Ký
          </button>
        </div>
      )}
    </div>
  );
}

