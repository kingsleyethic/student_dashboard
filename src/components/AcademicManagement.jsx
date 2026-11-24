import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function AcademicManagement() {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [facultyName, setFacultyName] = useState('');
  const [facultyDescription, setFacultyDescription] = useState('');

  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAcademicData();
  }, []);

  async function loadAcademicData() {
    const [facultyResult, departmentResult] = await Promise.all([
      supabase.from('faculties').select('*').order('name'),
      supabase.from('departments').select('*').order('name')
    ]);

    if (facultyResult.error || departmentResult.error) {
      setMessage(
        facultyResult.error?.message ||
        departmentResult.error?.message
      );
      return;
    }

    setFaculties(facultyResult.data || []);
    setDepartments(departmentResult.data || []);
  }

  async function createFaculty(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.rpc('admin_create_faculty', {
      faculty_name: facultyName.trim(),
      faculty_description: facultyDescription.trim()
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Faculty created successfully!');
      setFacultyName('');
      setFacultyDescription('');
      await loadAcademicData();
    }

    setLoading(false);
  }

  async function createDepartment(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.rpc('admin_create_department', {
      department_name: departmentName.trim(),
      department_description: departmentDescription.trim(),
      selected_faculty_id: Number(selectedFaculty)
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Department created successfully!');
      setDepartmentName('');
      setDepartmentDescription('');
      setSelectedFaculty('');
      await loadAcademicData();
    }

    setLoading(false);
  }

  return (
    <div className="academic-management">

      <h2>Academic Management</h2>

      {message && <p role="status">{message}</p>}

      <section className="course-card">
        <h3>Create Faculty</h3>

        <form onSubmit={createFaculty}>
          <input
            type="text"
            placeholder="Faculty Name"
            value={facultyName}
            onChange={(e) => setFacultyName(e.target.value)}
            required
          />

          <textarea
            placeholder="Faculty Description"
            value={facultyDescription}
            onChange={(e) => setFacultyDescription(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Create Faculty'}
          </button>
        </form>
      </section>

      <section className="course-card">
        <h3>Create Department</h3>

        <form onSubmit={createDepartment}>
          <input
            type="text"
            placeholder="Department Name"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />

          <textarea
            placeholder="Department Description"
            value={departmentDescription}
            onChange={(e) => setDepartmentDescription(e.target.value)}
          />

          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            required
          >
            <option value="">Select Faculty</option>

            {faculties.map(faculty => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Create Department'}
          </button>
        </form>
      </section>

      <section>
        <h3>Existing Faculties</h3>

        {faculties.map(faculty => (
          <div className="course-card" key={faculty.id}>
            <h4>{faculty.name}</h4>
            <p>{faculty.description}</p>
          </div>
        ))}
      </section>

      <section>
        <h3>Existing Departments</h3>

        {departments.map(department => {
          const faculty = faculties.find(
            item => item.id === department.faculty_id
          );

          return (
            <div className="course-card" key={department.id}>
              <h4>{department.name}</h4>
              <p>{department.description}</p>
              <p>Faculty: {faculty?.name || 'Unknown'}</p>
            </div>
          );
        })}
      </section>

      <button onClick={loadAcademicData}>
        Refresh Academic Data
      </button>

    </div>
  );
}

export default AcademicManagement;