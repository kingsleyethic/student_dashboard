import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [faculties, setFaculties] = useState([]);
const [departments, setDepartments] = useState([]);

const [selectedFaculty, setSelectedFaculty] = useState('');
const [selectedDepartment, setSelectedDepartment] = useState('');
useEffect(() => {
  async function fetchAcademicData() {
    // Fetch faculties
    const { data: facultyData, error: facultyError } =
      await supabase
        .from('faculties')
        .select('id, name');

    if (facultyError) {
      console.error('Faculty loading error:', facultyError);
    } else {
      setFaculties(facultyData);
    }

    // Fetch departments
    const { data: departmentData, error: departmentError } =
      await supabase
        .from('departments')
        .select('id, name, faculty_id');

    if (departmentError) {
      console.error('Department loading error:', departmentError);
    } else {
      setDepartments(departmentData);
    }
  }

  fetchAcademicData();
}, []);

  async function handleRegister(e) {
    e.preventDefault();
    setMessage('Creating your account...');

    const { error } = await supabase.auth.signUp({
      email,
      password,
  options: {
  emailRedirectTo: 'https://student-dashboard-lyart-psi.vercel.app',
  data: {
    full_name: fullName,
    faculty_id: selectedFaculty,
    department_id: selectedDepartment
  }
}
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Registration successful! Check your email to confirm your account.');
    }
  }

  return (
    <div className="register-container">
      <h2>Create Student Account</h2>

      <form onSubmit={handleRegister}>
        <select
  value={selectedFaculty}
  onChange={(e) => {
    setSelectedFaculty(e.target.value);
    setSelectedDepartment('');
  }}
  required
>
  <option value="">Select Faculty</option>

  {faculties.map((faculty) => (
    <option key={faculty.id} value={faculty.id}>
      {faculty.name}
    </option>
  ))}
</select>
<select
  value={selectedDepartment}
  onChange={(e) => setSelectedDepartment(e.target.value)}
  required
  disabled={!selectedFaculty}
>
  <option value="">Select Department</option>

  {departments
    .filter(
      (department) =>
        department.faculty_id === Number(selectedFaculty)
    )
    .map((department) => (
      <option key={department.id} value={department.id}>
        {department.name}
      </option>
    ))}
</select>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <button type="submit">Register</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;