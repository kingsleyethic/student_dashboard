 import { useState, useEffect } from "react";
 const initialCourses = [
   {
     code: "CSC 319",
     title: "Compiler Construction",
     progress: 75,
   },
   {
     code: "CSC 323",
     title: "Operating Systems II",
     progress: 60,
   },
   {
     code: "CSC 335",
     title: "Automata Theory",
     progress: 85,
   },
 ];

function Course() {
    const [courses, setCourses] = useState(() => {
  const savedCourses = localStorage.getItem("courses");

  return savedCourses
    ? JSON.parse(savedCourses)
    : initialCourses;
});

   const [code, setCode] = useState("");
   const [title, setTitle] = useState("");
   const [editingCode, setEditingCode] = useState(null);

const [editTitle, setEditTitle] = useState("");
const [editCourseCode, setEditCourseCode] = useState("");
const [searchTerm, setSearchTerm] = useState("");
   useEffect(() => {
  localStorage.setItem("courses", JSON.stringify(courses));
}, [courses]);


   function addCourse(event) {
    
     event.preventDefault();

     const trimmedCode = code.trim();
     const trimmedTitle = title.trim();

     if (!trimmedCode || !trimmedTitle) {
       return;
     }

     const alreadyExists = courses.some(
       (course) => course.code.toLowerCase() === trimmedCode.toLowerCase()
     );

     if (alreadyExists) {
       alert("This course already exists!");
       return;
     }

     const newCourse = {
       code: trimmedCode,
       title: trimmedTitle,
       progress: 0,
     };

     setCourses((currentCourses) => [...currentCourses, newCourse]);
     setCode("");
     setTitle("");
   }

   function increaseProgress(courseCode)
    {
     setCourses((currentCourses) =>
       currentCourses.map((course) => {
         if (course.code === courseCode && course.progress < 100) {
          return {
            ...course,
             progress: Math.min(course.progress + 5, 100),
          };
        }
        

        return course;
      })
     
      
    );
  }

  function deleteCourse(courseCode) {
    setCourses((currentCourses) =>
      currentCourses.filter((course) => course.code !== courseCode)
    );
  }
  const filteredCourses = courses.filter((course) => {
  return (
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
});
 function startEdit(course) {
  setEditingCode(course.code);
  setEditCourseCode(course.code);
  setEditTitle(course.title);

}
 function saveEdit(courseCode) {
  const trimmedCode = editCourseCode.trim();
  const trimmedTitle = editTitle.trim();

  if (!trimmedCode || !trimmedTitle) {
    alert("Course code and title cannot be empty!");
    return;
  }

  const duplicate = courses.some(
    (course) =>
      course.code.toLowerCase() === trimmedCode.toLowerCase() &&
      course.code !== courseCode
  );

  if (duplicate) {
    alert("This course code already exists!");
    return;
  }

  setCourses((currentCourses) =>
    currentCourses.map((course) =>
      course.code === courseCode
        ? {
            ...course,
            code: trimmedCode,
            title: trimmedTitle,
          }
        : course
    )
  );

  setEditingCode(null);
  setEditCourseCode("");
  setEditTitle("");
}

  return (
    <section className="courses">
      <h2>My Courses</h2>
      <input
  type="text"
  placeholder="Search courses by code or title..."
  value={searchTerm}
  onChange={(event) => setSearchTerm(event.target.value)}
  className="search-input"
/>

       <form className="course-form" onSubmit={addCourse}>
         <input
           type="text"
           value={code}
           onChange={(event) => setCode(event.target.value)}
           placeholder="Course code"
           aria-label="Course code"
         />
         <input
           type="text"
           value={title}
           onChange={(event) => setTitle(event.target.value)}
           placeholder="Course title"
           aria-label="Course title"
         />
         <button type="submit">Add Course</button>
       </form>

      <div className="course-container">
         {filteredCourses.map((course) => (
          <div className="course-card" key={course.code}>
              
 {editingCode === course.code ? (
  <>
    <input
      type="text"
      value={editCourseCode}
      onChange={(event) => setEditCourseCode(event.target.value)}
      placeholder="Course code"
    />

    <input
      type="text"
      value={editTitle}
      onChange={(event) => setEditTitle(event.target.value)}
      placeholder="Course title"
    />
  </>
) : (
  <>
    <h3>{course.code}</h3>
    <p>{course.title}</p>
  </>
)}

            <div className="progress-info">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>

             <button type="button" onClick={() => increaseProgress(course.code)}>
              Increase Progress
            </button>
        {editingCode === course.code ? (
  <button type="button" onClick={() => saveEdit(course.code)}>
    Save Changes
  </button>
) : (
  <button type="button" onClick={() => startEdit(course)}>
    Edit Course
  </button>
)}
            <button type="button" onClick={() => deleteCourse(course.code)}>
              Delete Course
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Course;