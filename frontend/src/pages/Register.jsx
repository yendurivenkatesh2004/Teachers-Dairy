import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [name, setName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  useEffect(() => { return () => clearTimeout(redirectTimer.current); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !mobileNo || !password) {
      setError('Please fill in all mandatory fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobileNo, password, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed.');

      setSuccess('Account registered successfully! Redirecting to login...');
      redirectTimer.current = setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Create Portal Account</h2>

        {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Mobile Number</label>
            <input
              type="text"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              placeholder="9876543210"
              maxLength="10"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', fontSize: '0.95rem' }}
              disabled={loading}
            >
              <option value="teacher">Teacher</option>
              <option value="hod">Head of Department (HOD)</option>
              <option value="admin">Administrator</option>
              <option value="principal">Principal</option>
              <option value="hm">HM / Headmistress</option>
              <option value="deputy_hm">Deputy HM / Headmistress</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: loading ? '#9ccc65' : '#2196F3', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#2196F3', textDecoration: 'none', fontWeight: 'bold' }}>Log In here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
