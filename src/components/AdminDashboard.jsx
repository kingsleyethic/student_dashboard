 import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import StudentManagement from './StudentManagement.jsx';
import LecturerAssignment from './LecturerAssignment.jsx';
import AnnouncementManagement from './AnnouncementManagement.jsx';

function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    description: '',
    faculty_id: '',
    department_id: ''
  });

  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  async function loadAdminDashboard() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/';
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || profile?.role !== 'admin') {
      setMessage('Administrator access required.');
      setLoading(false);
      return;
    }

    setAdmin(profile);

    const results = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student'),
      supabase.from('profiles').select('*').eq('role', 'lecturer'),
      supabase.from('courses').select('*').order('id'),
      supabase.from('faculties').select('*').order('name'),
      supabase.from('departments').select('*').order('name')
    ]);

    setStudents(results[0].data || []);
    setLecturers(results[1].data || []);
    setCourses(results[2].data || []);
    setFaculties(results[3].data || []);
    setDepartments(results[4].data || []);

    const errors = results.map(result => result.error).filter(Boolean);

    if (errors.length) {
      setMessage(errors.map(error => error.message).join(' | '));
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function saveCourse(e) {
    e.preventDefault();
    setMessage('');

    if (!courseForm.faculty_id || !courseForm.department_id) {
      setMessage('Please select a faculty and department.');
      return;
    }

    const courseData = {
      code: courseForm.code.trim(),
      title: courseForm.title.trim(),
      description: courseForm.description.trim(),
      faculty_id: Number(courseForm.faculty_id),
      department_id: Number(courseForm.department_id)
    };

    let result;

    if (editingCourse) {
      result = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourse.id);
    } else {
      result = await supabase
        .from('courses')
        .insert(courseData);
    }

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(editingCourse ? 'Course updated!' : 'Course created!');

    setEditingCourse(null);

    setCourseForm({
      code: '',
      title: '',
      description: '',
      faculty_id: '',
      department_id: ''
    });

    await loadAdminDashboard();
  }

  function editCourse(course) {
    setEditingCourse(course);

    setCourseForm({
      code: course.code || '',
      title: course.title || '',
      description: course.description || '',
      faculty_id: String(course.faculty_id || ''),
      department_id: String(course.department_id || '')
    });

    setActiveTab('courses');
  }

  async function toggleArchive(course) {
    const newStatus = !course.is_archived;

    const { error } = await supabase
      .from('courses')
      .update({ is_archived: newStatus })
      .eq('id', course.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(newStatus ? 'Course archived.' : 'Course restored.');
    await loadAdminDashboard();
  }

  async function changeLecturerRole(lecturer) {
    const confirmed = window.confirm(
      `Change ${lecturer.full_name} to student?`
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc('admin_set_user_role', {
      target_user_id: lecturer.id,
      new_role: 'student'
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Lecturer role updated.');
    await loadAdminDashboard();
  }

  if (loading) {
    return <h2>Loading Admin Dashboard...</h2>;
  }

  const filteredDepartments = departments.filter(
    department =>
      String(department.faculty_id) === String(courseForm.faculty_id)
  );

  return (
    <div className="admin-dashboard">

      <header>
        <h1>University LMS Administration</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <h2>Welcome, {admin?.full_name}</h2>
      <p>University Management Control Centre</p>

      {message && <p role="status">{message}</p>}

     <nav className="admin-navigation">
  {[
    { id: 'overview', label: 'Overview', icon: '▦' },
    { id: 'students', label: 'Students', icon: '♙' },
    { id: 'lecturers', label: 'Lecturers', icon: '♟' },
    { id: 'courses', label: 'Courses', icon: '▤' },
    { id: 'faculties', label: 'Faculties', icon: '⌂' },
    { id: 'departments', label: 'Departments', icon: '▥' },
    { id: 'announcements', label: 'Announcements', icon: '◉' }
  ].map(tab => (
    <button
      key={tab.id}
      className={activeTab === tab.id ? 'active' : ''}
      onClick={() => setActiveTab(tab.id)}
    >
      <span>{tab.icon}</span>
      {tab.label}
    </button>
  ))}
</nav>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <section>
          <h2>Dashboard Overview</h2>

          <div className="dashboard-stats">
            <div className="course-card">
              <h3>{students.length}</h3>
              <p>Students</p>
            </div>

            <div className="course-card">
              <h3>{lecturers.length}</h3>
              <p>Lecturers</p>
            </div>

            <div className="course-card">
              <h3>{courses.length}</h3>
              <p>Courses</p>
            </div>

            <div className="course-card">
              <h3>{faculties.length}</h3>
              <p>Faculties</p>
            </div>

            <div className="course-card">
              <h3>{departments.length}</h3>
              <p>Departments</p>
            </div>
          </div>
        </section>
      )}

      {/* STUDENTS */}
      {activeTab === 'students' && (
        <StudentManagement />
      )}

      {/* LECTURERS */}
      {activeTab === 'lecturers' && (
        <section>
          <h2>Lecturer Management</h2>

          <LecturerAssignment />

          {lecturers.map(lecturer => (
            <div className="course-card" key={lecturer.id}>
              <h3>{lecturer.full_name}</h3>
              <p>Department ID: {lecturer.department_id}</p>

              <button onClick={() => changeLecturerRole(lecturer)}>
                Change to Student
              </button>
            </div>
          ))}
        </section>
      )}

      {/* COURSES */}
      {activeTab === 'courses' && (
        <section>
          <h2>Course Management</h2>

          <div className="course-card">
            <h3>
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </h3>

            <form onSubmit={saveCourse}>
              <input
                placeholder="Course Code (e.g. CSC 340)"
                value={courseForm.code}
                onChange={e =>
                  setCourseForm({
                    ...courseForm,
                    code: e.target.value
                  })
                }
                required
              />

              <input
                placeholder="Course Title"
                value={courseForm.title}
                onChange={e =>
                  setCourseForm({
                    ...courseForm,
                    title: e.target.value
                  })
                }
                required
              />

              <textarea
                placeholder="Course Description"
                value={courseForm.description}
                onChange={e =>
                  setCourseForm({
                    ...courseForm,
                    description: e.target.value
                  })
                }
              />

              <select
                value={courseForm.faculty_id}
                onChange={e =>
                  setCourseForm({
                    ...courseForm,
                    faculty_id: e.target.value,
                    department_id: ''
                  })
                }
                required
              >
                <option value="">Select Faculty</option>

                {faculties.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={courseForm.department_id}
                onChange={e =>
                  setCourseForm({
                    ...courseForm,
                    department_id: e.target.value
                  })
                }
                required
              >
                <option value="">Select Department</option>

                {filteredDepartments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button type="submit">
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>

              {editingCourse && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseForm({
                      code: '',
                      title: '',
                      description: '',
                      faculty_id: '',
                      department_id: ''
                    });
                  }}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </div>

          <h3>All Courses</h3>

          {courses.map(course => (
            <div className="course-card" key={course.id}>
              <h3>{course.code} — {course.title}</h3>
              <p>{course.description}</p>
              <p>
                Status: {course.is_archived ? 'Archived' : 'Active'}
              </p>

              <button onClick={() => editCourse(course)}>
                Edit
              </button>

              <button onClick={() => toggleArchive(course)}>
                {course.is_archived ? 'Restore' : 'Archive'}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* FACULTIES */}
      {activeTab === 'faculties' && (
        <section>
          <h2>Faculty Management</h2>

          {faculties.map(f => (
            <div className="course-card" key={f.id}>
              <h3>{f.name}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* DEPARTMENTS */}
      {activeTab === 'departments' && (
        <section>
          <h2>Department Management</h2>

          {departments.map(d => (
            <div className="course-card" key={d.id}>
              <h3>{d.name}</h3>
              <p>{d.description}</p>
              <p>
                Faculty: {
                  faculties.find(f => f.id === d.faculty_id)?.name || 'Unknown'
                }
              </p>
            </div>
          ))}
        </section>
      )}
      {activeTab === 'announcements' && (
  <AnnouncementManagement />
)}

     <button
  className="refresh-dashboard-btn"
  onClick={loadAdminDashboard}
>
  ↻ Refresh Dashboard
</button>

    </div>
  );
}

export default AdminDashboard;