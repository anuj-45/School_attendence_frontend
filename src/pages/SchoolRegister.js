import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function SchoolRegister() {
  const [formData, setFormData] = useState({
    school_name: '',
    udise_code: '',
    principal: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.toUpperCase() // Convert UDISE code to uppercase
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate UDISE code format
      const udisePattern = /^[A-Z0-9]{11}$/;
      if (!udisePattern.test(formData.udise_code)) {
        setError('UDISE code must be exactly 11 alphanumeric characters');
        setLoading(false);
        return;
      }

      const response = await api.post('/school/register', formData);
      
      if (response.data) {
        alert(`School registered successfully!\n\nSchool: ${response.data.school_name}\nUDISE Code: ${response.data.udise_code}\n\nPlease note down your UDISE code. You will need it for login.`);
        // Store UDISE code temporarily for the next step
        sessionStorage.setItem('udise_code', response.data.udise_code);
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>School Attendance System</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#7f8c8d' }}>
          Register Your School
        </p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="school_name">School Name</label>
            <input
              type="text"
              id="school_name"
              name="school_name"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              required
              placeholder="Enter your school's full name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="udise_code">UDISE Code</label>
            <input
              type="text"
              id="udise_code"
              name="udise_code"
              value={formData.udise_code}
              onChange={handleChange}
              required
              maxLength="11"
              placeholder="11-digit UDISE code"
              disabled={loading}
              style={{ textTransform: 'uppercase' }}
            />
            <small style={{ color: '#7f8c8d', fontSize: '12px', display: 'block', marginTop: '5px' }}>
              11-character alphanumeric code (e.g., 12345678901)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="principal">Principal Name</label>
            <input
              type="text"
              id="principal"
              name="principal"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
              required
              placeholder="Enter principal's full name"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register School'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>
            Already registered?
          </p>
          <button 
            className="btn" 
            style={{ width: '100%', backgroundColor: '#6c757d', color: 'white' }}
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default SchoolRegister;
