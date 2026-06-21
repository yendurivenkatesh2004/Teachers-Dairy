import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <-- Add this line

/**
 * Login Component
 * @param {Function} onLoginSuccess - Callback function to pass the authenticated user's data back to App.jsx
 */
function Login({ onLoginSuccess }) {
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation check
    if (!mobileNo || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNo, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid mobile number or password.');
      }

      // 1. Save token and user details to localStorage for session persistence
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 2. Trigger parent callback to transition app state to logged-in mode
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Server connection failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '70vh'
    }}>
      <div style={{
        background: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Teacher Portal Login</h2>
        
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="mobileNo" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              Mobile Number
            </label>
            <input
              type="text"
              id="mobileNo"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              placeholder="9876543210"
              maxLength="10"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ccc65' : '#4CAF50',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
          Don't have an account yet? <Link to="/register" style={{ color: '#4CAF50', textDecoration: 'none', fontWeight: 'bold' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
