import React, { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import ParentMessaging from '../components/ParentMessaging';

function TeacherDashboard() {
  const [myClass, setMyClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('attendance');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyReportData, setMonthlyReportData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [yearlyReportData, setYearlyReportData] = useState(null);

  useEffect(() => {
    loadClassData();
  }, []);

  useEffect(() => {
    if (myClass) {
      loadAttendance();
    }
  }, [selectedDate, myClass]);

  const loadClassData = async () => {
    try {
      const [classRes, studentsRes] = await Promise.all([
        api.get('/teacher/class'),
        api.get('/teacher/students')
      ]);
      setMyClass(classRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      showMessage('error', 'Failed to load class data');
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/attendance/${selectedDate}`);
      const attendanceMap = {};
      response.data.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      showMessage('error', 'Failed to load attendance');
    }
    setLoading(false);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const loadReport = async () => {
    if (!myClass) {
      showMessage('error', 'Class information not loaded');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/daily?class_id=${myClass.id}&date=${reportDate}`);
      setReportData(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load report');
    }
    setLoading(false);
  };

  const loadMonthlyReport = async () => {
    if (!myClass) {
      showMessage('error', 'Class information not loaded');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/class/monthly?class_id=${myClass.id}&month=${selectedMonth}&year=${selectedYear}`);
      setMonthlyReportData(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load monthly report');
    }
    setLoading(false);
  };

  const loadYearlyReport = async () => {
    if (!myClass || !selectedStudent || !selectedAcademicYear) {
      showMessage('error', 'Please select a student and academic year');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/student/yearly?student_id=${selectedStudent}&academic_year=${selectedAcademicYear}`);
      setYearlyReportData(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load yearly report');
    }
    setLoading(false);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance({
      ...attendance,
      [studentId]: status
    });
  };

  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate !== today) {
      showMessage('error', 'You can only mark attendance for today');
      return;
    }

    try {
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'present'
      }));

      await api.post('/teacher/attendance', {
        attendance_date: selectedDate,
        attendance_records: attendanceRecords
      });

      showMessage('success', 'Attendance marked successfully');
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const isPastDate = selectedDate < new Date().toISOString().split('T')[0];
  const isFutureDate = selectedDate > new Date().toISOString().split('T')[0];

  return (
    <div>
      <Navbar />
      <div className="container">
        <h2 style={{ marginBottom: '20px' }}>Teacher Dashboard</h2>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {myClass && (
          <div className="card">
            <h3>My Class: {myClass.standard} - {myClass.section}</h3>
            <p>Academic Year: {myClass.academic_year}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('attendance')}
          >
            Mark Attendance
          </button>
          <button 
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reports')}
          >
            Daily Reports
          </button>
          <button 
            className={`btn ${activeTab === 'monthlyReports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('monthlyReports')}
          >
            Monthly Reports
          </button>
          <button 
            className={`btn ${activeTab === 'yearlyReports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('yearlyReports')}
          >
            Yearly Reports
          </button>
          <button 
            className={`btn ${activeTab === 'messaging' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('messaging')}
          >
            Notify Parents
          </button>
        </div>

        {activeTab === 'attendance' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Mark Attendance</h3>
            <div>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '8px', fontSize: '14px' }}
              />
            </div>
          </div>

          {isPastDate && (
            <div className="alert alert-info">
              You are viewing past attendance. Only admin can edit past records.
            </div>
          )}

          {isFutureDate && (
            <div className="alert alert-info">
              You cannot mark attendance for future dates.
            </div>
          )}

          {loading ? <div className="spinner"></div> : (
            <div>
              <div className="attendance-grid">
                {students.map(student => {
                  const status = attendance[student.id] || 'present';
                  const isLate = status === 'late';
                  
                  return (
                    <div 
                      key={student.id} 
                      className="student-attendance-row"
                      style={{ 
                        backgroundColor: isLate ? '#fff3cd' : 'white',
                        border: isLate ? '2px solid #ffc107' : 'none'
                      }}
                    >
                      <div>
                        <strong>{student.roll_number}</strong>
                      </div>
                      <div>{student.name}</div>
                      <div className="attendance-options">
                        <label>
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="present"
                            checked={status === 'present'}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                            disabled={isPastDate || isFutureDate}
                          />
                          Present
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="absent"
                            checked={status === 'absent'}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                            disabled={isPastDate || isFutureDate}
                          />
                          Absent
                        </label>
                        <label style={{ color: '#f39c12', fontWeight: isLate ? 'bold' : 'normal' }}>
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="late"
                            checked={status === 'late'}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                            disabled={isPastDate || isFutureDate}
                          />
                          Late
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isPastDate && !isFutureDate && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button className="btn btn-success" onClick={handleSubmit}>
                    Submit Attendance
                  </button>
                </div>
              )}

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                <h4 style={{ marginBottom: '10px' }}>Late Students Information</h4>
                <p style={{ fontSize: '14px', color: '#2c3e50' }}>
                  Students marked as "Late" are counted as present for attendance percentage calculation.
                  The late status is tracked separately to inform parents about punctuality.
                </p>
              </div>
            </div>
          )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="card">
            <h3>Daily Attendance Report</h3>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Select Date</label>
                <input 
                  type="date" 
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={loadReport}>
                  Load Report
                </button>
              </div>
            </div>

            {loading ? <div className="spinner"></div> : reportData && (
              <div>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>
                    {reportData.class.standard} - {reportData.class.section} | {new Date(reportData.date).toLocaleDateString()}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#155724' }}>Overall Statistics</h5>
                      <p style={{ margin: '5px 0' }}>Total Students: <strong>{reportData.statistics.total_students}</strong></p>
                      <p style={{ margin: '5px 0' }}>Present: <strong>{reportData.statistics.present + reportData.statistics.late}{reportData.statistics.late > 0 && ` (${reportData.statistics.late} late)`}</strong></p>
                      <p style={{ margin: '5px 0' }}>Absent: <strong>{reportData.statistics.absent}</strong></p>
                      <p style={{ margin: '5px 0' }}>Unmarked: <strong>{reportData.statistics.total_unmarked}</strong></p>
                      <p style={{ margin: '10px 0 0 0', fontSize: '18px' }}>
                        Attendance: <strong>{reportData.statistics.attendance_percentage}%</strong>
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#cce5ff', borderRadius: '8px', border: '1px solid #b8daff' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#004085' }}>Male Students</h5>
                      <p style={{ margin: '5px 0' }}>Total: <strong>{reportData.gender_breakdown.male.total}</strong></p>
                      <p style={{ margin: '5px 0' }}>Present: <strong>{reportData.gender_breakdown.male.present + reportData.gender_breakdown.male.late}{reportData.gender_breakdown.male.late > 0 && ` (${reportData.gender_breakdown.male.late} late)`}</strong></p>
                      <p style={{ margin: '5px 0' }}>Absent: <strong>{reportData.gender_breakdown.male.absent}</strong></p>
                      <p style={{ margin: '5px 0' }}>Unmarked: <strong>{reportData.gender_breakdown.male.unmarked}</strong></p>
                      <p style={{ margin: '10px 0 0 0', fontSize: '18px' }}>
                        Attendance: <strong>{reportData.gender_breakdown.male.attendance_percentage}%</strong>
                      </p>
                    </div>

                    <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Female Students</h5>
                      <p style={{ margin: '5px 0' }}>Total: <strong>{reportData.gender_breakdown.female.total}</strong></p>
                      <p style={{ margin: '5px 0' }}>Present: <strong>{reportData.gender_breakdown.female.present + reportData.gender_breakdown.female.late}{reportData.gender_breakdown.female.late > 0 && ` (${reportData.gender_breakdown.female.late} late)`}</strong></p>
                      <p style={{ margin: '5px 0' }}>Absent: <strong>{reportData.gender_breakdown.female.absent}</strong></p>
                      <p style={{ margin: '5px 0' }}>Unmarked: <strong>{reportData.gender_breakdown.female.unmarked}</strong></p>
                      <p style={{ margin: '10px 0 0 0', fontSize: '18px' }}>
                        Attendance: <strong>{reportData.gender_breakdown.female.attendance_percentage}%</strong>
                      </p>
                    </div>
                  </div>

                  <h4 style={{ marginTop: '25px', marginBottom: '15px' }}>Student Details</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.students.map(student => (
                        <tr key={student.id}>
                          <td>{student.roll_number}</td>
                          <td>{student.name}</td>
                          <td style={{ textTransform: 'capitalize' }}>{student.gender}</td>
                          <td>
                            <span style={{
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              backgroundColor: 
                                student.status === 'present' ? '#d4edda' :
                                student.status === 'absent' ? '#f8d7da' :
                                student.status === 'late' ? '#fff3cd' : '#e2e3e5',
                              color:
                                student.status === 'present' ? '#155724' :
                                student.status === 'absent' ? '#721c24' :
                                student.status === 'late' ? '#856404' : '#383d41'
                            }}>
                              {student.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monthlyReports' && myClass && (
          <div className="card">
            <h3>Monthly Attendance Report</h3>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Month</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Year</label>
                <input 
                  type="number" 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="2020"
                  max="2030"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={loadMonthlyReport}>
                  Load Report
                </button>
              </div>
            </div>

            {loading ? <div className="spinner"></div> : monthlyReportData && (
              <div>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>
                    {monthlyReportData.class.standard} - {monthlyReportData.class.section} | 
                    {new Date(monthlyReportData.period.year, monthlyReportData.period.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h4>

                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
                    <h5 style={{ marginTop: 0 }}>Period Information</h5>
                    <p style={{ margin: '5px 0' }}>Total Days in Month: <strong>{monthlyReportData.period.total_days}</strong></p>
                    <p style={{ margin: '5px 0' }}>Holidays: <strong>{monthlyReportData.period.holidays}</strong></p>
                    <p style={{ margin: '5px 0' }}>Total School Days: <strong>{monthlyReportData.period.total_school_days}</strong></p>
                  </div>
                  
                  <h4 style={{ marginBottom: '15px' }}>Student Attendance Summary</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Name</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                        <th>Late %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReportData.students.map(student => (
                        <tr key={student.student_id}>
                          <td>{student.roll_number}</td>
                          <td>{student.name}</td>
                          <td>{student.total_present}{student.late > 0 && ` (${student.late} late)`}</td>
                          <td style={{ color: student.absent > 0 ? '#dc3545' : 'inherit', fontWeight: student.absent > 0 ? 'bold' : 'normal' }}>
                            {student.absent}
                          </td>
                          <td style={{ 
                            fontWeight: 'bold',
                            color: student.attendance_percentage >= 75 ? '#28a745' : '#dc3545'
                          }}>
                            {student.attendance_percentage}%
                          </td>
                          <td>{student.late_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      <strong>Note:</strong> Students with attendance below 75% are highlighted in red.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'yearlyReports' && myClass && (
          <div className="card">
            <h3>Yearly Attendance Report (Student)</h3>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Select Student</label>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.roll_number} - {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Academic Year</label>
                <select 
                  value={selectedAcademicYear} 
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select Year --</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={loadYearlyReport}>
                  Load Report
                </button>
              </div>
            </div>

            {loading ? <div className="spinner"></div> : yearlyReportData && (
              <div>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '15px' }}>
                    {yearlyReportData.student.name} (Roll No: {yearlyReportData.student.roll_number}) | 
                    {yearlyReportData.student.standard} - {yearlyReportData.student.section}
                  </h4>

                  <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', border: '2px solid #c3e6cb' }}>
                    <h5 style={{ marginTop: 0, color: '#155724' }}>Overall Yearly Summary ({yearlyReportData.academic_year})</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>Total School Days</p>
                        <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{yearlyReportData.yearly_summary.total_school_days}</p>
                      </div>
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>Present Days</p>
                        <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                          {yearlyReportData.yearly_summary.present + yearlyReportData.yearly_summary.late}
                          {yearlyReportData.yearly_summary.late > 0 && <span style={{ fontSize: '16px', color: '#ffc107' }}> ({yearlyReportData.yearly_summary.late} late)</span>}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>Absent Days</p>
                        <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{yearlyReportData.yearly_summary.absent}</p>
                      </div>
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>Attendance %</p>
                        <p style={{ 
                          margin: '0', 
                          fontSize: '32px', 
                          fontWeight: 'bold',
                          color: yearlyReportData.yearly_summary.attendance_percentage >= 75 ? '#28a745' : '#dc3545'
                        }}>
                          {yearlyReportData.yearly_summary.attendance_percentage}%
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>Late %</p>
                        <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>{yearlyReportData.yearly_summary.late_percentage}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4 style={{ marginBottom: '15px' }}>Monthly Breakdown</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>School Days</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyReportData.monthly_breakdown.map((month, index) => (
                        <tr key={index}>
                          <td><strong>{month.month_name} {month.year}</strong></td>
                          <td>{month.total_school_days}</td>
                          <td>{month.total_present}{month.late > 0 && ` (${month.late} late)`}</td>
                          <td style={{ color: month.absent > 0 ? '#dc3545' : 'inherit', fontWeight: month.absent > 0 ? 'bold' : 'normal' }}>
                            {month.absent}
                          </td>
                          <td style={{ 
                            fontWeight: 'bold',
                            color: month.attendance_percentage >= 75 ? '#28a745' : '#dc3545'
                          }}>
                            {month.attendance_percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      <strong>Note:</strong> Academic year runs from April to March. Months with attendance below 75% are highlighted in red.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messaging' && (
          <ParentMessaging myClass={myClass} />
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
