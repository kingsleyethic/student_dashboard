import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function LecturerStudents({ courses, enrollments }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, [enrollments]);

  async function loadStudents() {
    setLoading(true);
    setError('');

    try {
      const studentIds = [
        ...new Set(enrollments.map(item => item.student_id))
      ];

      if (!studentIds.length) {
        setStudents([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, department_id, faculty_id')
        .in('id', studentIds)
        .eq('role', 'student');

      if (error) throw error;

      setStudents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading students...</p>;

  return (
    <section className="dashboard-section">
      <h2>👨‍🎓 Enrolled Students</h2>

      {error && <p role="alert">{error}</p>}

      {students.length === 0 ? (
        <p>No students enrolled in your courses yet.</p>
      ) : (
        courses.filter(course => !course.is_archived).map(course => {
          const courseEnrollments = enrollments.filter(
            item => item.course_id === course.id
          );

          return (
            <div className="course-card" key={course.id}>
              <h3>{course.code} - {course.title}</h3>

              <p>
                Total Students: {courseEnrollments.length}
              </p>

              {courseEnrollments.length === 0 ? (
                <p>No students enrolled.</p>
              ) : (
                courseEnrollments.map(enrollment => {
                  const student = students.find(
                    item => item.id === enrollment.student_id
                  );

                  return (
                    <div key={enrollment.id}>
                      <hr />

                      <h4>
                        {student?.full_name || 'Student profile unavailable'}
                      </h4>

                      <p>
                        Enrollment Date:{' '}
                        {enrollment.enrolled_at
                          ? new Date(enrollment.enrolled_at).toLocaleDateString()
                          : 'Not available'}
                      </p>

                      <p>
                        Progress: {enrollment.progress ?? 0}%
                      </p>

                      <progress
                        value={enrollment.progress ?? 0}
                        max="100"
                      />
                    </div>
                  );
                })
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

export default LecturerStudents;