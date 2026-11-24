import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function LecturerAssignment() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [studentResult, departmentResult] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, role')
        .eq('role', 'student'),
      supabase.from('departments')
        .select('id, name')
        .order('name')
    ]);

    if (studentResult.error || departmentResult.error) {
      setMessage('Unable to load students or departments.');
      return;
    }

    setStudents(studentResult.data || []);
    setDepartments(departmentResult.data || []);
  }

  async function assignLecturer(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.rpc('admin_assign_lecturer', {
      target_user_id: studentId,
      target_department_id: Number(departmentId)
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Lecturer successfully assigned!');
      setStudentId('');
      setDepartmentId('');
      loadData();
    }

    setLoading(false);
  }

  return (
    <div className="admin-section">
      <h2>Assign Lecturer</h2>

      <form onSubmit={assignLecturer}>
        <label>Select Student</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        >
          <option value="">Choose a student</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.full_name}
            </option>
          ))}
        </select>

        <label>Select Department</label>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
        >
          <option value="">Choose a department</option>
          {departments.map(department => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Assigning...' : 'Assign Lecturer'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default LecturerAssignment;