import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [udiseCode, setUdiseCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Get UDISE code from session storage if coming from school registration
    const storedUdise = sessionStorage.getItem('udise_code');
    if (storedUdise) {
      setUdiseCode(storedUdise);
    }
  }, []);

  useEffect(() => {
    if (udiseCode && udiseCode.length === 11) {
      checkAdminExists();
    }
  }, [udiseCode]);

  const checkAdminExists = async () => {
    try {
      const response = await api.get(`/auth/check-admin?udise_code=${udiseCode}`);
      setAdminExists(response.data.adminExists);
    } catch (error) {
      console.error('Error checking admin:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!udiseCode || udiseCode.length !== 11) {
      setError('Please enter a valid 11-character UDISE code');
      return;
    }
    
    setLoading(true);

    const result = await login(username, password, udiseCode);
    
    setLoading(false);

    if (result.success) {
      // Clear session storage after successful login
      sessionStorage.removeItem('udise_code');
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!udiseCode || udiseCode.length !== 11) {
      setError('Please enter a valid 11-character UDISE code');
      return;
    }
    
    setLoading(true);

    try {
      await api.post('/auth/create-first-admin', {
        username,
        password,
        full_name: fullName,
        email,
        udise_code: udiseCode
      });

      setSuccess('Admin account created successfully! Please login.');
      setIsCreatingAdmin(false);
      setShowCreateAdmin(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setAdminExists(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create admin account');
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');

    if (!username) {
      setError('Please enter your username first');
      return;
    }

    if (!udiseCode || udiseCode.length !== 11) {
      setError('Please enter a valid 11-character UDISE code');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        username,
        udise_code: udiseCode
      });

      const { temporaryPassword, fullName, role } = response.data;
      
      setSuccess(
        `Password reset successful!\n\n` +
        `User: ${fullName} (${role})\n` +
        `Username: ${username}\n` +
        `New Password: ${temporaryPassword}\n\n` +
        `Please save this password and login now.`
      );
      setPassword('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>School Attendance System</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#7f8c8d' }}>
          {isCreatingAdmin ? 'Create New Admin Account' : 'Sign in to continue'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!isCreatingAdmin ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>School UDISE Code</label>
                <input
                  type="text"
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value.toUpperCase())}
                  required
                  maxLength="11"
                  placeholder="11-digit UDISE code"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3498db',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              {udiseCode && udiseCode.length === 11 && !adminExists && (
                <p style={{ fontSize: '14px', color: '#e74c3c', marginBottom: '10px' }}>
                  No admin account found for this school!
                </p>
              )}
              <button 
                className="btn btn-success" 
                style={{ width: '100%' }}
                onClick={() => setIsCreatingAdmin(true)}
                disabled={!udiseCode || udiseCode.length !== 11}
              >
                {adminExists ? 'Create New Admin Account' : 'Create First Admin Account'}
              </button>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                Don't have a school account?
              </p>
              <button 
                className="btn" 
                style={{ width: '100%', backgroundColor: '#6c757d', color: 'white' }}
                onClick={() => navigate('/register-school')}
              >
                Register Your School
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateAdmin}>
            <div className="form-group">
              <label>School UDISE Code *</label>
              <input
                type="text"
                value={udiseCode}
                onChange={(e) => setUdiseCode(e.target.value.toUpperCase())}
                required
                maxLength="11"
                placeholder="11-digit UDISE code"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email (optional)"
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Choose a strong password"
                minLength="6"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => {
                  setIsCreatingAdmin(false);
                  setUsername('');
                  setPassword('');
                  setFullName('');
                  setEmail('');
                  setError('');
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
