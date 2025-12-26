import React, { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import ParentMessaging from '../components/ParentMessaging';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyReportData, setMonthlyReportData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [yearlyReportData, setYearlyReportData] = useState(null);

  // Student search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Promotion states
  const [promotionData, setPromotionData] = useState([]);
  const [selectedForPromotion, setSelectedForPromotion] = useState([]);
  const [promotionClass, setPromotionClass] = useState('');
  const [promotionYear, setPromotionYear] = useState('');

  // Generate academic year options (current year and next 2 years)
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -1; i <= 2; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  };

  const academicYears = generateAcademicYears();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'students') {
        const response = await api.get('/admin/students');
        setStudents(response.data);
        // Load classes for filter dropdown if not already loaded
        if (classes.length === 0) {
          const classesResponse = await api.get('/admin/classes');
          setClasses(classesResponse.data);
        }
      } else if (activeTab === 'teachers') {
        const response = await api.get('/admin/teachers');
        setTeachers(response.data);
      } else if (activeTab === 'classes') {
        const response = await api.get('/admin/classes');
        setClasses(response.data);
      } else if (activeTab === 'holidays') {
        const response = await api.get('/admin/holidays');
        setHolidays(response.data);
      } else if (activeTab === 'reports' || activeTab === 'monthlyReports' || activeTab === 'yearlyReports') {
        // Load classes and students for dropdown if not already loaded
        if (classes.length === 0) {
          const response = await api.get('/admin/classes');
          setClasses(response.data);
        }
        if (students.length === 0 && activeTab === 'yearlyReports') {
          const response = await api.get('/admin/students');
          setStudents(response.data);
        }
      }
    } catch (error) {
      showMessage('error', 'Failed to load data');
    }
    setLoading(false);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Filter and search students
  const getFilteredStudents = () => {
    let filtered = [...students];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.roll_number.toLowerCase().includes(query) ||
        `${student.standard} - ${student.section}`.toLowerCase().includes(query) ||
        student.academic_year.includes(query)
      );
    }

    // Apply class filter
    if (filterClass) {
      const classObj = classes.find(c => c.id === parseInt(filterClass));
      if (classObj) {
        filtered = filtered.filter(student =>
          `${student.standard} - ${student.section}` === `${classObj.standard} - ${classObj.section}`
        );
      }
    }

    // Apply gender filter
    if (filterGender) {
      filtered = filtered.filter(student => student.gender === filterGender);
    }

    // Apply academic year filter
    if (filterAcademicYear) {
      filtered = filtered.filter(student => student.academic_year === filterAcademicYear);
    }

    return filtered;
  };

  // Get paginated students
  const getPaginatedStudents = () => {
    const filtered = getFilteredStudents();
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const filtered = getFilteredStudents();
    return Math.ceil(filtered.length / rowsPerPage);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterClass('');
    setFilterGender('');
    setFilterAcademicYear('');
    setCurrentPage(1);
  };

  // Load students for promotion with their attendance
  const loadPromotionData = async () => {
    if (!promotionClass || !promotionYear) {
      showMessage('error', 'Please select class and academic year');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/yearly-class?class_id=${promotionClass}&academic_year=${promotionYear}`);
      const studentsWithAttendance = response.data.students || [];
      
      // Auto-select all students (uncheck failed students manually)
      const autoSelected = studentsWithAttendance.map(s => s.student_id);
      
      setPromotionData(studentsWithAttendance);
      setSelectedForPromotion(autoSelected);
    } catch (error) {
      showMessage('error', 'Failed to load promotion data');
    }
    setLoading(false);
  };

  // Handle promotion checkbox toggle
  const togglePromotionSelection = (studentId) => {
    if (selectedForPromotion.includes(studentId)) {
      setSelectedForPromotion(selectedForPromotion.filter(id => id !== studentId));
    } else {
      setSelectedForPromotion([...selectedForPromotion, studentId]);
    }
  };

  // Select all for promotion
  const selectAllForPromotion = () => {
    setSelectedForPromotion(promotionData.map(s => s.student_id));
  };

  // Deselect all for promotion
  const deselectAllForPromotion = () => {
    setSelectedForPromotion([]);
  };

  // Promote selected students
  const promoteStudents = async () => {
    if (selectedForPromotion.length === 0) {
      showMessage('error', 'Please select at least one student to promote');
      return;
    }

    // Auto-calculate next academic year
    const [startYear] = promotionYear.split('-').map(Number);
    const nextAcademicYear = `${startYear + 1}-${startYear + 2}`;

    const confirmMsg = `Promote ${selectedForPromotion.length} student(s) to next class and academic year ${nextAcademicYear}?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/promote-students', {
        student_ids: selectedForPromotion,
        current_class_id: promotionClass
      });
      showMessage('success', `Successfully promoted ${selectedForPromotion.length} student(s)!`);
      setPromotionData([]);
      setSelectedForPromotion([]);
      setPromotionClass('');
      setPromotionYear('');
      loadData(); // Reload students
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to promote students');
    }
    setLoading(false);
  };

  const loadReport = async () => {
    if (!selectedClass) {
      showMessage('error', 'Please select a class');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/daily?class_id=${selectedClass}&date=${selectedDate}`);
      setReportData(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load report');
    }
    setLoading(false);
  };

  const loadMonthlyReport = async () => {
    if (!selectedClass) {
      showMessage('error', 'Please select a class');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/class/monthly?class_id=${selectedClass}&month=${selectedMonth}&year=${selectedYear}`);
      setMonthlyReportData(response.data);
    } catch (error) {
      showMessage('error', 'Failed to load monthly report');
    }
    setLoading(false);
  };

  const loadYearlyReport = async () => {
    if (!selectedStudent || !selectedAcademicYear) {
      showMessage('error', 'Please select a student and academic year');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/reports/student/yearly?student_id=${selectedStudent}&academic_year=${selectedAcademicYear}`);
      setYearlyReportData(response.data);
      console.log('Yearly report data:', response.data);
    } catch (error) {
      console.error('Yearly report error:', error.response?.data || error.message);
      showMessage('error', error.response?.data?.error || 'Failed to load yearly report');
    }
    setLoading(false);
  };

  const openModal = async (type, data = {}) => {
    setModalType(type);
    setFormData(data);
    setShowModal(true);
    
    // Load classes if opening student modal and classes not loaded
    if ((type === 'addStudent' || type === 'editStudent') && classes.length === 0) {
      try {
        const response = await api.get('/admin/classes');
        setClasses(response.data);
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    }
    
    // Load teachers if opening class modal and teachers not loaded
    if (type === 'addClass' && teachers.length === 0) {
      try {
        const response = await api.get('/admin/teachers');
        setTeachers(response.data);
      } catch (error) {
        console.error('Failed to load teachers:', error);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'addStudent') {
        await api.post('/admin/students', formData);
        showMessage('success', 'Student added successfully');
      } else if (modalType === 'editStudent') {
        await api.put(`/admin/students/${formData.id}`, formData);
        showMessage('success', 'Student updated successfully');
      } else if (modalType === 'addTeacher') {
        await api.post('/admin/teachers', formData);
        showMessage('success', 'Teacher added successfully');
      } else if (modalType === 'addClass') {
        await api.post('/admin/classes', formData);
        showMessage('success', 'Class added successfully');
      } else if (modalType === 'addHoliday') {
        await api.post('/admin/holidays', formData);
        showMessage('success', 'Holiday added successfully');
      }
      closeModal();
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'student') {
        await api.delete(`/admin/students/${id}`);
        showMessage('success', 'Student deleted successfully');
      } else if (type === 'teacher') {
        await api.delete(`/admin/teachers/${id}`);
        showMessage('success', 'Teacher deleted successfully');
      } else if (type === 'class') {
        await api.delete(`/admin/classes/${id}`);
        showMessage('success', 'Class deleted successfully');
      } else if (type === 'holiday') {
        await api.delete(`/admin/holidays/${id}`);
        showMessage('success', 'Holiday deleted successfully');
      }
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h2 style={{ marginBottom: '20px' }}>Admin Dashboard</h2>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('students')}
          >
            Students
          </button>
          <button 
            className={`btn ${activeTab === 'teachers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('teachers')}
          >
            Teachers
          </button>
          <button 
            className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('classes')}
          >
            Classes
          </button>
          <button 
            className={`btn ${activeTab === 'holidays' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('holidays')}
          >
            Holidays
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
            className={`btn ${activeTab === 'promote' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('promote')}
          >
            Promote Students
          </button>
          <button 
            className={`btn ${activeTab === 'messaging' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('messaging')}
          >
            Notify Parents
          </button>        </div>

        <div className="card">
          {activeTab === 'students' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Students Management</h3>
                <button className="btn btn-success" onClick={() => openModal('addStudent')}>
                  Add Student
                </button>
              </div>

              {/* Search and Filters Section */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                {/* Search Box */}
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search by name, roll number, class, or year..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange(); }}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      fontSize: '14px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Filter Dropdowns */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <select
                    value={filterClass}
                    onChange={(e) => { setFilterClass(e.target.value); handleFilterChange(); }}
                    style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.standard} - {cls.section}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterGender}
                    onChange={(e) => { setFilterGender(e.target.value); handleFilterChange(); }}
                    style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>

                  <select
                    value={filterAcademicYear}
                    onChange={(e) => { setFilterAcademicYear(e.target.value); handleFilterChange(); }}
                    style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">All Academic Years</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <button
                    onClick={clearFilters}
                    className="btn btn-secondary"
                    style={{ padding: '8px 15px' }}
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Results Summary */}
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  Showing {getPaginatedStudents().length} of {getFilteredStudents().length} students
                  {getFilteredStudents().length !== students.length && ` (filtered from ${students.length} total)`}
                </div>
              </div>

              {loading ? <div className="spinner"></div> : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Admission No</th>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Class</th>
                        <th>Academic Year</th>
                        <th>Quick Links</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedStudents().length > 0 ? (
                        getPaginatedStudents().map(student => (
                          <tr key={student.id}>
                            <td>{student.roll_number}</td>
                            <td>{student.id}</td>
                            <td>{student.name}</td>
                            <td style={{ textTransform: 'capitalize' }}>{student.gender}</td>
                            <td>{student.standard} - {student.section}</td>
                            <td>{student.academic_year}</td>
                            <td>
                              <button 
                                className="btn btn-primary" 
                                style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }} 
                                onClick={() => {
                                  setSelectedStudent(student.id);
                                  setSelectedAcademicYear(student.academic_year);
                                  setActiveTab('yearlyReports');
                                  setTimeout(() => loadYearlyReport(), 100);
                                }}
                                title="View Student Monthly Attendance"
                              >
                                📅 Monthly
                              </button>
                            </td>
                            <td>
                              <button className="btn btn-primary" style={{ marginRight: '10px' }} onClick={() => openModal('editStudent', student)}>Edit</button>
                              <button className="btn btn-danger" onClick={() => handleDelete('student', student.id)}>Delete</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                            No students found matching your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {getFilteredStudents().length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px'
                    }}>
                      {/* Rows per page selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontSize: '14px', color: '#495057' }}>Rows per page:</label>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value));
                            setCurrentPage(1);
                          }}
                          style={{
                            padding: '5px 10px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Page navigation */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          First
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: '14px', color: '#495057' }}>
                          Page {currentPage} of {getTotalPages()}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === getTotalPages()}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          Next
                        </button>
                        <button
                          onClick={() => setCurrentPage(getTotalPages())}
                          disabled={currentPage === getTotalPages()}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Teachers Management</h3>
                <button className="btn btn-success" onClick={() => openModal('addTeacher')}>
                  Add Teacher
                </button>
              </div>
              {loading ? <div className="spinner"></div> : (
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Assigned Class</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(teacher => (
                      <tr key={teacher.id}>
                        <td>{teacher.username}</td>
                        <td>{teacher.full_name}</td>
                        <td>{teacher.email || 'N/A'}</td>
                        <td>{teacher.standard ? `${teacher.standard} - ${teacher.section}` : 'Not Assigned'}</td>
                        <td>
                          <button className="btn btn-danger" onClick={() => handleDelete('teacher', teacher.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'classes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Classes Management</h3>
                <button className="btn btn-success" onClick={() => openModal('addClass')}>
                  Add Class
                </button>
              </div>
              {loading ? <div className="spinner"></div> : (
                <table>
                  <thead>
                    <tr>
                      <th>Standard</th>
                      <th>Section</th>
                      <th>Academic Year</th>
                      <th>Teacher</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(cls => (
                      <tr key={cls.id}>
                        <td>{cls.standard}</td>
                        <td>{cls.section}</td>
                        <td>{cls.academic_year}</td>
                        <td>{cls.teacher_name || 'Not Assigned'}</td>
                        <td>{cls.student_count}</td>
                        <td>
                          <button className="btn btn-danger" onClick={() => handleDelete('class', cls.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'holidays' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Holidays Management</h3>
                <button className="btn btn-success" onClick={() => openModal('addHoliday')}>
                  Add Holiday
                </button>
              </div>
              {loading ? <div className="spinner"></div> : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Academic Year</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map(holiday => (
                      <tr key={holiday.id}>
                        <td>{new Date(holiday.holiday_date).toLocaleDateString()}</td>
                        <td>{holiday.description}</td>
                        <td>{holiday.academic_year}</td>
                        <td>
                          <button className="btn btn-danger" onClick={() => handleDelete('holiday', holiday.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h3>Daily Attendance Report</h3>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Select Class</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.standard} - {cls.section} ({cls.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Select Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
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

          {activeTab === 'monthlyReports' && (
            <div>
              <h3>Monthly Attendance Report</h3>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Select Class</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.standard} - {cls.section} ({cls.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

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
                        ))})
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

          {activeTab === 'yearlyReports' && (
            <div>
              <h3>Yearly Attendance Report (Student)</h3>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Search Student by Name or Roll Number</label>
                  <input
                    type="text"
                    placeholder="Type student name or roll number..."
                    value={selectedStudent ? students.find(s => s.id === parseInt(selectedStudent))?.name || '' : ''}
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      if (!query) {
                        setSelectedStudent('');
                        return;
                      }
                      const found = students.find(s => 
                        s.name.toLowerCase().includes(query) || 
                        s.roll_number.toLowerCase().includes(query)
                      );
                      if (found) {
                        setSelectedStudent(found.id);
                      }
                    }}
                    list="students-list"
                    style={{ width: '100%' }}
                  />
                  <datalist id="students-list">
                    {students.map(student => (
                      <option key={student.id} value={student.name}>
                        {student.roll_number} - {student.name} ({student.standard}-{student.section})
                      </option>
                    ))}
                  </datalist>
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
            <div>
              <ParentMessaging />
            </div>
          )}

          {activeTab === 'promote' && (
            <div>
              <h3>Promote Students to Next Academic Year</h3>
              
              <div style={{ 
                backgroundColor: '#fff3cd', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #ffc107'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>ℹ️ How it works:</strong> All students are automatically selected for promotion. 
                  Manually uncheck students who failed (based on exam results) before promoting.
                </p>
              </div>

              {/* Selection Filters */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Select Class</label>
                  <select 
                    value={promotionClass} 
                    onChange={(e) => setPromotionClass(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.standard} - {cls.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Current Academic Year</label>
                  <select 
                    value={promotionYear} 
                    onChange={(e) => setPromotionYear(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select Year --</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={loadPromotionData}
                    disabled={!promotionClass || !promotionYear}
                  >
                    Load Students
                  </button>
                </div>
              </div>

              {/* Promotion List */}
              {promotionData.length > 0 && (
                <>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong>{selectedForPromotion.length}</strong> of <strong>{promotionData.length}</strong> students selected for promotion
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-secondary" onClick={selectAllForPromotion}>
                        Select All
                      </button>
                      <button className="btn btn-secondary" onClick={deselectAllForPromotion}>
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {loading ? <div className="spinner"></div> : (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedForPromotion.length === promotionData.length}
                              onChange={(e) => e.target.checked ? selectAllForPromotion() : deselectAllForPromotion()}
                            />
                          </th>
                          <th>Roll No</th>
                          <th>Name</th>
                          <th>Class</th>
                          <th>Attendance %</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotionData.map(student => (
                          <tr 
                            key={student.student_id}
                            style={{ 
                              backgroundColor: !selectedForPromotion.includes(student.student_id) ? '#f8d7da' : 'white'
                            }}
                          >
                            <td>
                              <input 
                                type="checkbox"
                                checked={selectedForPromotion.includes(student.student_id)}
                                onChange={() => togglePromotionSelection(student.student_id)}
                              />
                            </td>
                            <td>{student.roll_number}</td>
                            <td>{student.name}</td>
                            <td>{student.standard} - {student.section}</td>
                            <td style={{ 
                              fontWeight: 'bold',
                              color: student.attendance_percentage >= 75 ? '#28a745' : '#dc3545'
                            }}>
                              {student.attendance_percentage}%
                            </td>
                            <td>
                              {selectedForPromotion.includes(student.student_id) ? (
                                <span style={{ 
                                  padding: '3px 10px', 
                                  backgroundColor: '#d4edda', 
                                  color: '#155724',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  SELECTED
                                </span>
                              ) : (
                                <span style={{ 
                                  padding: '3px 10px', 
                                  backgroundColor: '#f8d7da', 
                                  color: '#721c24',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  NOT SELECTED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Promotion Action */}
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#e7f3ff', 
                    borderRadius: '8px',
                    border: '1px solid #2196F3'
                  }}>
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        <strong>Automatic Promotion:</strong> Students will be promoted to the next class and academic year.<br/>
                        <span style={{ color: '#666' }}>Example: 9B (2024-2025) → 10B (2025-2026)</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-success" 
                        onClick={promoteStudents}
                        disabled={selectedForPromotion.length === 0}
                        style={{ padding: '12px 40px', fontSize: '16px' }}
                      >
                        🎓 Promote {selectedForPromotion.length} Student{selectedForPromotion.length !== 1 ? 's' : ''} to Next Class
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType.replace(/([A-Z])/g, ' $1').trim()}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              {(modalType === 'addStudent' || modalType === 'editStudent') && (
                <>
                  <div className="form-group">
                    <label>Roll Number</label>
                    <input type="text" value={formData.roll_number || ''} onChange={(e) => setFormData({...formData, roll_number: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Admission Number</label>
                    <input type="text" value={formData.admission_no || ''} onChange={(e) => setFormData({...formData, admission_no: e.target.value})} placeholder="Optional" />
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select value={formData.gender || ''} onChange={(e) => setFormData({...formData, gender: e.target.value})} required>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Class</label>
                    <select value={formData.class_id || ''} onChange={(e) => setFormData({...formData, class_id: e.target.value})} required>
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.standard} - {cls.section}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select value={formData.academic_year || ''} onChange={(e) => setFormData({...formData, academic_year: e.target.value})} required>
                      <option value="">Select Academic Year</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Parent Phone Number (Optional)</label>
                    <input type="tel" value={formData.parent_contact || ''} onChange={(e) => setFormData({...formData, parent_contact: e.target.value})} placeholder="10-digit mobile number" />
                  </div>
                  <div className="form-group">
                    <label>Parent Email *</label>
                    <input type="email" value={formData.parent_email || ''} onChange={(e) => setFormData({...formData, parent_email: e.target.value})} placeholder="parent@example.com" required />
                  </div>
                </>
              )}

              {modalType === 'addTeacher' && (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={formData.full_name || ''} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                </>
              )}

              {modalType === 'addClass' && (
                <>
                  <div className="form-group">
                    <label>Standard</label>
                    <input type="text" value={formData.standard || ''} onChange={(e) => setFormData({...formData, standard: e.target.value})} placeholder="e.g., 10" required />
                  </div>
                  <div className="form-group">
                    <label>Section</label>
                    <input type="text" value={formData.section || ''} onChange={(e) => setFormData({...formData, section: e.target.value})} placeholder="e.g., A" required />
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select value={formData.academic_year || ''} onChange={(e) => setFormData({...formData, academic_year: e.target.value})} required>
                      <option value="">Select Academic Year</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign Teacher</label>
                    <select value={formData.teacher_id || ''} onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}>
                      <option value="">Select Teacher</option>
                      {teachers.filter(t => !t.class_id).map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {modalType === 'addHoliday' && (
                <>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={formData.holiday_date || ''} onChange={(e) => setFormData({...formData, holiday_date: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input type="text" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g., Republic Day" required />
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select value={formData.academic_year || ''} onChange={(e) => setFormData({...formData, academic_year: e.target.value})} required>
                      <option value="">Select Academic Year</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-success">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
