import React, { useState } from 'react';
import api from '../api';

function ParentMessaging({ myClass }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const loadAbsentStudents = async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      if (myClass) {
        params.class_id = myClass.id;
      }
      const response = await api.get('/messaging/absent-students', { params });
      setAbsentStudents(response.data.students);
      setSelectedStudents([]);
      
      if (response.data.students.length === 0) {
        showMessage('info', 'No absent students found for this date');
      }
    } catch (error) {
      showMessage('error', 'Failed to load absent students');
    }
    setLoading(false);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(absentStudents.filter(s => s.parent_email).map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const sendNotifications = async () => {
    if (selectedStudents.length === 0) {
      showMessage('error', 'Please select at least one student');
      return;
    }

    const confirmMsg = `Send email absence notification to ${selectedStudents.length} parent(s)?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/messaging/send', {
        student_ids: selectedStudents,
        date: selectedDate
      });

      if (response.data.results.failed > 0) {
        showMessage('warning', `Sent ${response.data.results.sent} email messages. ${response.data.results.failed} failed.`);
      } else {
        showMessage('success', `Successfully sent ${response.data.results.sent} email message(s)!`);
      }
      
      // Reload to update message_sent status
      loadAbsentStudents();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to send notifications');
    }
    setLoading(false);
  };

  const loadMessageHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/messaging/history', {
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
      });
      setMessageHistory(response.data.messages);
    } catch (error) {
      showMessage('error', 'Failed to load message history');
    }
    setLoading(false);
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadMessageHistory();
    }
    setShowHistory(!showHistory);
  };

  const studentsWithEmail = absentStudents.filter(s => s.parent_email).length;

  return (
    <div className="card">
      <h3>� Notify Parents via Email</h3>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={`btn ${!showHistory ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowHistory(false)}
        >
          Send Notifications
        </button>
        <button 
          className={`btn ${showHistory ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleHistory}
        >
          Message History
        </button>
      </div>

      {!showHistory ? (
        <>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <button className="btn btn-primary" onClick={loadAbsentStudents} disabled={loading}>
              {loading ? 'Loading...' : 'Get Absent Students'}
            </button>
          </div>

          {absentStudents.length > 0 && (
            <>
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                <p style={{ margin: 0 }}>
                  <strong>{absentStudents.length}</strong> absent student(s) found | 
                  <strong> {studentsWithEmail}</strong> have parent email | 
                  <strong> {selectedStudents.length}</strong> selected
                </p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={selectedStudents.length === studentsWithEmail && studentsWithEmail > 0}
                      />
                    </th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Parent Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absentStudents.map(student => (
                    <tr key={student.id} style={{ backgroundColor: !student.parent_email ? '#f8f9fa' : 'white' }}>
                      <td>
                        <input 
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          disabled={!student.parent_email}
                        />
                      </td>
                      <td>{student.roll_number}</td>
                      <td>{student.name}</td>
                      <td>{student.standard} - {student.section}</td>
                      <td>
                        {student.parent_email || (
                          <span style={{ color: '#dc3545', fontStyle: 'italic' }}>No email</span>
                        )}
                      </td>
                      <td>
                        {student.message_sent > 0 ? (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Sent</span>
                        ) : (
                          <span style={{ color: '#6c757d' }}>Not sent</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-success" 
                  onClick={sendNotifications}
                  disabled={loading || selectedStudents.length === 0}
                >
                  {loading ? 'Sending...' : `� Send Email to ${selectedStudents.length} Parent(s)`}
                </button>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                <h4 style={{ marginTop: 0 }}>� Email Message Preview</h4>
                <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', border: '1px solid #ddd' }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Subject: Attendance Alert: [Student Name] - [Date]</p>
                  <hr style={{ margin: '10px 0' }} />
                  <p style={{ margin: '10px 0' }}>Dear Parent,</p>
                  <p style={{ margin: '10px 0' }}>This is to inform you that <strong>[Student Name]</strong> was marked as <strong>ABSENT</strong> on <strong>[Date]</strong>.</p>
                  <p style={{ margin: '10px 0' }}>If this is incorrect or if you have any concerns, please contact the school immediately.</p>
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>- School Administration</p>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          <h4>Message History for {new Date(selectedDate).toLocaleDateString()}</h4>
          
          {loading ? (
            <div className="spinner"></div>
          ) : messageHistory.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Sent By</th>
                </tr>
              </thead>
              <tbody>
                {messageHistory.map(msg => (
                  <tr key={msg.id}>
                    <td>{new Date(msg.sent_at).toLocaleTimeString()}</td>
                    <td>{msg.student_name} ({msg.roll_number})</td>
                    <td>{msg.standard} - {msg.section}</td>
                    <td>{msg.recipient}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: msg.status === 'sent' ? '#d4edda' : '#f8d7da',
                        color: msg.status === 'sent' ? '#155724' : '#721c24'
                      }}>
                        {msg.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{msg.sent_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No messages sent for this date
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ParentMessaging;
