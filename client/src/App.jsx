import React, { useState, useEffect } from 'react';
import { Layers, Database, Cpu, Layout, Users, ShieldCheck, Mail } from 'lucide-react';
import AddUserForm from './components/AddUserForm';
import UserTable from './components/UserTable';
import PendingInvitationsTable from './components/PendingInvitationsTable';
import AcceptInvitationPage from './components/AcceptInvitationPage';
import { getUsersApi, getPendingInvitationsApi } from './services/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState(null);

  // Nhận diện đường dẫn /accept-invitation?token=... hoặc ?token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const isAcceptPath = window.location.pathname.includes('/accept-invitation');

    if (token || isAcceptPath) {
      setInvitationToken(token);
    }
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersData, invitationsData] = await Promise.all([
        getUsersApi(),
        getPendingInvitationsApi(),
      ]);
      setUsers(usersData);
      setInvitations(invitationsData);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    setInvitationToken(null);
    loadAllData();
  };

  return (
    <div className="app-container">
      {/* CovAI Branding Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#6d5dfb',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(109, 93, 251, 0.35)',
            }}
          >
            &gt;_
          </div>
          <h1 className="app-title" style={{ margin: 0, letterSpacing: '-0.5px' }}>
            CovAI User Management
          </h1>
        </div>

        <div className="app-subtitle">
          <ShieldCheck size={18} color="#6d5dfb" />
          <span>Email Verification & Invitation Workflow for Add New User</span>
        </div>

        {/* 3 Layer Indicators */}
        <div className="layers-badge">
          <span className="layer-tag tag-presentation">
            <Layout size={14} />
            Presentation (React + Vite)
          </span>
          <span className="layer-tag tag-business">
            <Cpu size={14} />
            Business (Node.js + Email Service)
          </span>
          <span className="layer-tag tag-dal">
            <Database size={14} />
            DB Access (Prisma + PostgreSQL)
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {invitationToken !== null ? (
          // Màn hình /accept-invitation
          <AcceptInvitationPage
            token={invitationToken}
            onBackToHome={handleBackToHome}
          />
        ) : (
          // Màn hình Quản trị viên
          <>
            <div className="main-layout">
              {/* Form Add New User (Gửi lời mời) */}
              <AddUserForm onInvitationSent={loadAllData} />

              {/* Danh sách người dùng chính thức đã kích hoạt */}
              <UserTable
                users={users}
                loading={loading}
                onRefresh={loadAllData}
              />
            </div>

            {/* Bảng lời mời đang chờ (Pending Invitations + Resend Button) */}
            <PendingInvitationsTable
              invitations={invitations}
              onRefresh={loadAllData}
            />
          </>
        )}
      </main>
    </div>
  );
}
