import React, { useState } from 'react';
import { Mail, Clock, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { resendInvitationApi } from '../services/api';

export default function PendingInvitationsTable({ invitations, onRefresh }) {
  const [resendingEmail, setResendingEmail] = useState(null);
  const [cooldowns, setCooldowns] = useState({}); // { [email]: secondsLeft }
  const [resendStatus, setResendStatus] = useState(null); // { type, message }

  const handleResend = async (email) => {
    if (cooldowns[email] > 0) return;

    setResendingEmail(email);
    setResendStatus(null);

    try {
      const result = await resendInvitationApi(email);
      setResendStatus({
        type: 'success',
        message: result.message || `Đã gửi lại lời mời đến ${email}.`,
      });

      // Bật bộ đếm ngược 30 giây cooldown
      setCooldowns((prev) => ({ ...prev, [email]: 30 }));
      const interval = setInterval(() => {
        setCooldowns((prev) => {
          const current = prev[email] || 0;
          if (current <= 1) {
            clearInterval(interval);
            const copy = { ...prev };
            delete copy[email];
            return copy;
          }
          return { ...prev, [email]: current - 1 };
        });
      }, 1000);

      if (onRefresh) onRefresh();
    } catch (err) {
      setResendStatus({
        type: 'error',
        message: err.message || 'Lỗi khi gửi lại lời mời.',
      });
    } finally {
      setResendingEmail(null);
    }
  };

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
    <div className="card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h2 className="card-title">
          <Clock size={20} color="#f59e0b" />
          Lời Mời Đang Chờ Xác Nhận ({invitations.length})
        </h2>
        <button
          onClick={onRefresh}
          style={{
            background: 'none',
            border: 'none',
            color: '#4f46e5',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
          }}
        >
          Làm mới
        </button>
      </div>
      <p className="card-description">
        Danh sách tài khoản đã được quản trị viên gửi lời mời CovAI nhưng người dùng chưa kích hoạt.
      </p>

      {resendStatus && (
        <div className={`alert ${resendStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
          {resendStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{resendStatus.message}</span>
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <Mail size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <p>Hiện không có lời mời nào đang chờ kích hoạt.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Email người nhận</th>
                <th>Vai trò</th>
                <th>Hết hạn vào</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => {
                const cooldown = cooldowns[inv.email] || 0;
                const isProcessing = resendingEmail === inv.email;

                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.name}</td>
                    <td style={{ color: '#334155' }}>{inv.email}</td>
                    <td>
                      <span className="badge-role" style={{ background: '#f5f3ff', color: '#6d5dfb', borderColor: '#ddd6fe' }}>
                        {inv.role}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleResend(inv.email)}
                        disabled={isProcessing || cooldown > 0}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.775rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: cooldown > 0 ? '#f1f5f9' : '#ffffff',
                          color: cooldown > 0 ? '#94a3b8' : '#4f46e5',
                          cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw size={12} className="spinner" /> Đang gửi...
                          </>
                        ) : cooldown > 0 ? (
                          <>
                            <Clock size={12} /> Đợi {cooldown}s
                          </>
                        ) : (
                          <>
                            <Send size={12} /> Gửi lại (Resend)
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

