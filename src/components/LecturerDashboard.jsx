import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import AnnouncementFeed from './AnnouncementFeed.jsx';

import LecturerStudents from './LecturerStudents.jsx';
function LecturerDashboard() {
  const [lecturer, setLecturer] = useState(null);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [message, setMessage] = useState('');

  // Course form
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  // Material form
  const [selectedCourse, setSelectedCourse] = useState('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  // LOAD DASHBOARD
  async function loadDashboard() {
    setLoading(true);
    setMessage('');

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage('Your session has expired. Please log in again.');
        await supabase.auth.signOut();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'lecturer') {
        setMessage('Unable to load lecturer profile.');
        return;
      }

      setLecturer(profile);

      const { data: assignments, error: assignmentError } =
        await supabase
          .from('lecturer_assignments')
          .select('department_id')
          .eq('lecturer_id', user.id);

      if (assignmentError) throw assignmentError;

      const departmentIds = (assignments || []).map(
        assignment => assignment.department_id
      );

      if (!departmentIds.length) {
        setCourses([]);
        setMaterials([]);
        setEnrollments([]);
        return;
      }

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .in('department_id', departmentIds)
        .order('created_at', { ascending: false });

      if (courseError) throw courseError;

      const loadedCourses = courseData || [];
      setCourses(loadedCourses);

      if (!loadedCourses.length) {
        setMaterials([]);
        setEnrollments([]);
        return;
      }

      const courseIds = loadedCourses.map(course => course.id);

      const { data: materialData, error: materialError } =
        await supabase
          .from('course_materials')
          .select('*')
          .in('course_id', courseIds)
          .eq('uploaded_by', user.id)
          .order('uploaded_at', { ascending: false });

      if (materialError) throw materialError;

      setMaterials(materialData || []);

      const { data: enrollmentData, error: enrollmentError } =
        await supabase
          .from('enrollments')
          .select('id, course_id, student_id, progress, enrolled_at')
          .in('course_id', courseIds);

      if (enrollmentError) throw enrollmentError;

      setEnrollments(enrollmentData || []);

    } catch (error) {
      setMessage(error.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  // CREATE COURSE
  async function handleCreateCourse(e) {
    e.preventDefault();
    setMessage('');

    if (!courseCode.trim() || !courseTitle.trim()) {
      setMessage('Enter a course code and title.');
      return;
    }

    if (!lecturer?.department_id || !lecturer?.faculty_id) {
      setMessage('Your lecturer profile has no assigned department or faculty.');
      return;
    }

    setCreatingCourse(true);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please log in again.');
      }

      const { error } = await supabase
        .from('courses')
        .insert({
          code: courseCode.trim().toUpperCase(),
          title: courseTitle.trim(),
          description: courseDescription.trim(),
          faculty_id: lecturer.faculty_id,
          department_id: lecturer.department_id,
          created_by: user.id
        });

      if (error) throw error;

      setCourseCode('');
      setCourseTitle('');
      setCourseDescription('');

      setMessage('Course created successfully!');
      await loadDashboard();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setCreatingCourse(false);
    }
  }

  // UPLOAD MATERIAL
  async function handleUpload(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedCourse || !materialTitle.trim() || !file) {
      setMessage('Complete all upload fields.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size must not exceed 10MB.');
      return;
    }

    setUploading(true);

    let filePath = null;

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please log in again.');
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      filePath = `${selectedCourse}/${user.id}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: databaseError } = await supabase
        .from('course_materials')
        .insert({
          course_id: Number(selectedCourse),
          uploaded_by: user.id,
          title: materialTitle.trim(),
          description: materialDescription.trim(),
          file_path: filePath,
          file_type: file.type
        });

      if (databaseError) {
        await supabase.storage
          .from('course-materials')
          .remove([filePath]);

        throw databaseError;
      }

      setMaterialTitle('');
      setMaterialDescription('');
      setSelectedCourse('');
      setFile(null);

      const fileInput = document.getElementById('material-file');
      if (fileInput) fileInput.value = '';

      setMessage('Learning material uploaded successfully!');
      await loadDashboard();

    } catch (error) {
      setMessage(error.message || 'Material upload failed.');
    } finally {
      setUploading(false);
      <LecturerStudents
  courses={courses}
  enrollments={enrollments}
/>
    }
  }

  // DOWNLOAD MATERIAL
  async function handleDownload(material) {
    setMessage('');

    const { data, error } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(material.file_path, 60);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  // ARCHIVE OR RESTORE COURSE
  async function handleArchiveCourse(course) {
    const action = course.is_archived ? 'restore' : 'archive';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${course.code}?`
    );

    if (!confirmed) return;

    setMessage('');

    const { error } = await supabase
      .from('courses')
      .update({ is_archived: !course.is_archived })
      .eq('id', course.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      course.is_archived
        ? 'Course restored successfully!'
        : 'Course archived successfully!'
    );

    await loadDashboard();
  }

  // LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <h2>Loading Lecturer Dashboard...</h2>;
  }

  const activeCourses = courses.filter(
    course => !course.is_archived
  );

  const archivedCourses = courses.filter(
    course => course.is_archived
  );

  return (
    <div className="lecturer-dashboard">

      {/* HEADER */}
      <header>
        <div>
          <h1>Lecturer Dashboard</h1>
          <p>Academic Management Portal</p>
        </div>

        <button onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* WELCOME */}
      <section>
        <h2>Welcome, {lecturer?.full_name}!</h2>
        <p>Manage your courses, students and learning materials.</p>
      </section>

      {/* UNIVERSITY ANNOUNCEMENTS */}
      <section className="dashboard-section">
        <AnnouncementFeed />
      </section>

      {/* NOTIFICATIONS */}
      {message && (
        <p role="status" className="dashboard-message">
          {message}
        </p>
      )}

      {/* STATISTICS */}
      <section className="dashboard-stats">

        <div className="course-card">
          <h3>{courses.length}</h3>
          <p>Total Courses</p>
        </div>

        <div className="course-card">
          <h3>{enrollments.length}</h3>
          <p>Total Enrollments</p>
        </div>

        <div className="course-card">
          <h3>{materials.length}</h3>
          <p>Uploaded Materials</p>
        </div>

      </section>

      {/* CREATE COURSE */}
      <section className="dashboard-section">
        <h2>➕ Create New Course</h2>

        <form onSubmit={handleCreateCourse}>

          <input
            type="text"
            placeholder="Course Code (e.g. CSC 340)"
            value={courseCode}
            onChange={e => setCourseCode(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Course Title"
            value={courseTitle}
            onChange={e => setCourseTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Course Description"
            value={courseDescription}
            onChange={e => setCourseDescription(e.target.value)}
          />

          <p>Department ID: {lecturer?.department_id}</p>

          <button type="submit" disabled={creatingCourse}>
            {creatingCourse ? 'Creating...' : 'Create Course'}
          </button>

        </form>
      </section>

      {/* ACTIVE COURSES */}
      <section className="dashboard-section">
        <h2>My Active Courses</h2>

        {activeCourses.length === 0 ? (
          <p>No active courses available.</p>
        ) : (
          activeCourses.map(course => (
            <div className="course-card" key={course.id}>
              <h3>{course.code}</h3>
              <h4>{course.title}</h4>
              <p>{course.description}</p>

              <p>
                Students enrolled:{' '}
                {enrollments.filter(
                  item => item.course_id === course.id
                ).length}
              </p>

              <button onClick={() => handleArchiveCourse(course)}>
                Archive Course
              </button>
            </div>
          ))
        )}
      </section>

      {/* ARCHIVED COURSES */}
      <section className="dashboard-section">
        <h2>Archived Courses</h2>

        {archivedCourses.length === 0 ? (
          <p>No archived courses.</p>
        ) : (
          archivedCourses.map(course => (
            <div className="course-card" key={course.id}>
              <h3>{course.code}</h3>
              <h4>{course.title}</h4>
              <p>This course is archived.</p>

              <button onClick={() => handleArchiveCourse(course)}>
                Restore Course
              </button>
            </div>
          ))
        )}
      </section>

      {/* UPLOAD MATERIALS */}
      <section className="dashboard-section">
        <h2>📚 Upload Learning Materials</h2>

        <form onSubmit={handleUpload}>

          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            required
          >
            <option value="">Select Course</option>

            {activeCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Material Title"
            value={materialTitle}
            onChange={e => setMaterialTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Material Description"
            value={materialDescription}
            onChange={e => setMaterialDescription(e.target.value)}
          />

          <input
            id="material-file"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
          />

          <small>Maximum file size: 10MB</small>

          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Material'}
          </button>

        </form>
      </section>

      {/* UPLOADED MATERIALS */}
      <section className="dashboard-section">
        <h2>My Uploaded Materials</h2>

        {materials.length === 0 ? (
          <p>No materials uploaded yet.</p>
        ) : (
          materials.map(material => {
            const course = courses.find(
              item => item.id === material.course_id
            );

            return (
              <div className="course-card" key={material.id}>
                <h3>{material.title}</h3>
                <p>{course?.code}</p>
                <p>{material.description}</p>

                <button onClick={() => handleDownload(material)}>
                  View / Download
                </button>
              </div>
            );
          })
        )}
      </section>

    </div>
  );
}

export default LecturerDashboard;