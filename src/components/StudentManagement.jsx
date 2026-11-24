import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [departmentId, setDepartmentId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);

    const [studentResult, facultyResult, departmentResult] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('faculties').select('*'),
        supabase.from('departments').select('*')
      ]);

    if (studentResult.error || facultyResult.error || departmentResult.error) {
      setMessage(
        studentResult.error?.message ||
        facultyResult.error?.message ||
        departmentResult.error?.message
      );
    } else {
      setStudents(studentResult.data || []);
      setFaculties(facultyResult.data || []);
      setDepartments(departmentResult.data || []);
    }

    setLoading(false);
  }

  async function promoteStudent(e) {
    e.preventDefault();

    if (!selectedStudent || !departmentId) return;

    const confirmed = window.confirm(
      `Promote ${selectedStudent.full_name} to lecturer?`
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc('admin_assign_lecturer', {
      target_user_id: selectedStudent.id,
      target_department_id: Number(departmentId)
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`${selectedStudent.full_name} is now a lecturer.`);
    setSelectedStudent(null);
    setDepartmentId('');
    await loadStudents();
  }

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p>Loading students...</p>;

  return (
    <div className="student-management">
      <h2>Student Management</h2>

      {message && <p role="status">{message}</p>}

      <input
        type="search"
        placeholder="Search students by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <h3>Total Students: {students.length}</h3>

      {filteredStudents.length === 0 && <p>No students found.</p>}

      {filteredStudents.map(student => {
        const faculty = faculties.find(
          f => f.id === student.faculty_id
        );

        const department = departments.find(
          d => d.id === student.department_id
        );

        return (
          <div className="course-card" key={student.id}>
            <h3>{student.full_name}</h3>
            <p>Faculty: {faculty?.name || 'Not assigned'}</p>
            <p>Department: {department?.name || 'Not assigned'}</p>
            <p>Account Type: Student</p>

            <button onClick={() => setSelectedStudent(student)}>
              Promote to Lecturer
            </button>
          </div>
        );
      })}

      {selectedStudent && (
        <section className="course-card">
          <h3>Promote {selectedStudent.full_name}</h3>

          <form onSubmit={promoteStudent}>
            <label>Select Department</label>

            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              required
            >
              <option value="">Choose Department</option>

              {departments.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <button type="submit">Confirm Promotion</button>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <button onClick={loadStudents}>Refresh Students</button>
    </div>
  );
}

export default StudentManagement;