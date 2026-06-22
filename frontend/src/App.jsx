import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminPanel from './pages/AdminPanel';
import HeadMasterDashboard from './pages/HeadMasterDashboard';
import HODDashboard from './pages/HODDashboard';
import Register from './pages/Register';

// Reusable tab wrapper for any role that both monitors AND teaches
function MonitorWithTeaching({ user, monitorLabel, MonitorComponent, monitorProps }) {
  const [activeTab, setActiveTab] = useState('monitor');
  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', borderBottom: '2px solid #e2e8f0' }}>
        {[
          { key: 'monitor', label: monitorLabel },
          { key: 'teaching', label: '📋 My Teaching' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 24px',
              backgroundColor: activeTab === tab.key ? '#4CAF50' : '#f1f5f9',
              color: activeTab === tab.key ? 'white' : '#475569',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '6px 6px 0 0',
              fontSize: '0.95rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'monitor'
        ? <MonitorComponent {...monitorProps} />
        : <TeacherDashboard teacherId={user.id} />
      }
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try { setUser(JSON.parse(savedUser)); }
      catch { localStorage.removeItem('user'); localStorage.removeItem('token'); }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (authenticatedUser) => setUser(authenticatedUser);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    switch (user.role) {
      case 'admin':
        return <AdminPanel userId={user.id} />;
      case 'hm':
      case 'deputy_hm':
      case 'principal':
        return (
          <MonitorWithTeaching
            user={user}
            monitorLabel="🏫 HM Dashboard"
            MonitorComponent={HeadMasterDashboard}
            monitorProps={{ role: user.role }}
          />
        );
      case 'hod':
        return (
          <MonitorWithTeaching
            user={user}
            monitorLabel="🎯 HOD View"
            MonitorComponent={HODDashboard}
            monitorProps={{ userId: user.id }}
          />
        );
      default: // teacher
        return <TeacherDashboard teacherId={user.id} />;
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <h3>Initializing School Gateways...</h3>
    </div>
  );

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fb', fontFamily: 'Arial, sans-serif' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '1px solid #eef2f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/images/logo.jpeg" alt="Montessori Indus School" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '6px' }} />
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.3rem', fontWeight: '700' }}>Montessori Indus Residential School - Syllabus Tracking </h2>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.95rem', color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>{user.name}</strong>
                <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold' }}>{user.role}</span>
              </span>
              <button
                onClick={handleLogout}
                style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                onMouseOver={e => e.target.style.backgroundColor = '#dc2626'}
                onMouseOut={e => e.target.style.backgroundColor = '#ef4444'}
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
          <Routes>
            <Route path="/login" element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
            <Route path="/" element={renderDashboard()} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
