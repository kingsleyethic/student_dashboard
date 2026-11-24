import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import AnnouncementFeed from './AnnouncementFeed.jsx';

function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      window.location.href = '/';
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'student') {
      setMessage('Unable to load student profile.');
      setLoading(false);
      return;
    }

    setStudent(profile);

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, code, title, description, is_archived')
      .eq('department_id', profile.department_id);

    if (courseError) {
      setMessage(courseError.message);
      setLoading(false);
      return;
    }

    setCourses(courseData || []);

    const { data: enrollmentData, error: enrollmentError } =
      await supabase
        .from('enrollments')
        .select('id, course_id, progress')
        .eq('student_id', user.id);

    if (enrollmentError) {
      setMessage(enrollmentError.message);
      setLoading(false);
      return;
    }

    setEnrolled(enrollmentData || []);

    const courseIds = (enrollmentData || []).map(
      enrollment => enrollment.course_id
    );

    if (courseIds.length > 0) {
      const { data: materialData, error: materialError } =
        await supabase
          .from('course_materials')
          .select('*')
          .in('course_id', courseIds)
          .order('uploaded_at', { ascending: false });

      if (materialError) {
        console.error('Materials error:', materialError.message);
      } else {
        setMaterials(materialData || []);
      }
    } else {
      setMaterials([]);
    }

    setLoading(false);
  }

  async function enrollCourse(courseId) {
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage('Please log in again.');
      return;
    }

    const course = courses.find(item => item.id === courseId);

    if (!course || course.is_archived) {
      setMessage('This course is no longer available.');
      return;
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
        progress: 0
      });

    if (error) {
      setMessage(
        error.code === '23505'
          ? 'You are already enrolled in this course.'
          : error.message
      );
      return;
    }

    setMessage('Successfully enrolled in course!');
    await loadDashboard();
  }

  async function downloadMaterial(material) {
    const { data, error } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(material.file_path, 60);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return <h2>Loading Student Dashboard...</h2>;
  }

  const myCourses = courses.filter(course =>
    enrolled.some(item => item.course_id === course.id)
  );

  const availableCourses = courses.filter(course =>
    !course.is_archived &&
    !enrolled.some(item => item.course_id === course.id)
  );

  return (
    <div className="student-dashboard">

      <header>
        <h1>Student Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <section className="student-welcome">
        <h2>Welcome, {student?.full_name}!</h2>
        <p>Your academic learning space.</p>
      </section>

      {/* UNIVERSITY ANNOUNCEMENTS */}
      <AnnouncementFeed />

      <section className="student-information">
        <h2>Academic Information</h2>
        <p>Faculty ID: {student?.faculty_id}</p>
        <p>Department ID: {student?.department_id}</p>
      </section>

      {message && <p role="status">{message}</p>}

      <section className="student-courses">
        <h2>My Enrolled Courses</h2>

        {myCourses.length === 0 ? (
          <p>You haven't enrolled in any courses yet.</p>
        ) : (
          myCourses.map(course => {
            const enrollment = enrolled.find(
              item => item.course_id === course.id
            );

            return (
              <div className="course-card" key={course.id}>
                <h3>{course.code}</h3>
                <h4>{course.title}</h4>
                <p>{course.description}</p>

                {course.is_archived && (
                  <p>Archived course – existing enrollment retained.</p>
                )}

                <p>Progress: {enrollment?.progress ?? 0}%</p>

                <progress
                  value={enrollment?.progress ?? 0}
                  max="100"
                />
              </div>
            );
          })
        )}
      </section>

      <section className="student-courses">
        <h2>Available Courses</h2>

        {availableCourses.length === 0 ? (
          <p>No additional courses available.</p>
        ) : (
          availableCourses.map(course => (
            <div className="course-card" key={course.id}>
              <h3>{course.code}</h3>
              <h4>{course.title}</h4>
              <p>{course.description}</p>

              <button onClick={() => enrollCourse(course.id)}>
                Enroll Now
              </button>
            </div>
          ))
        )}
      </section>

      <section className="student-courses">
        <h2>My Learning Materials</h2>

        {materials.length === 0 ? (
          <p>No learning materials available yet.</p>
        ) : (
          materials.map(material => {
            const course = courses.find(
              item => item.id === material.course_id
            );

            return (
              <div className="course-card" key={material.id}>
                <h3>{material.title}</h3>
                <p>Course: {course?.code || 'Course material'}</p>
                <p>{material.description}</p>

                <button onClick={() => downloadMaterial(material)}>
                  Download Material
                </button>
              </div>
            );
          })
        )}
      </section>

    </div>
  );
}

export default StudentDashboard;