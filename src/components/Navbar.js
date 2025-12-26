import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1>School Attendance System</h1>
        <div className="user-info">
          <span>Welcome, {user?.full_name}</span>
          <span style={{ 
            padding: '4px 12px', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: '12px',
            fontSize: '12px',
            textTransform: 'uppercase'
          }}>
            {user?.role}
          </span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
