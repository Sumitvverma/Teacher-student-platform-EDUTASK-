import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Frontpage, Footer }      from '../Pages/Frontpage.jsx';
import LoginForm                  from '../Pages/Login.jsx';
import Signup                     from '../Pages/Signup.jsx';
import TeacherDashboard           from '../Pages/Teacherdashboard.jsx';
import StudentDashboard           from '../Pages/Studentdashboard.jsx';
import HomeworkDashboard          from '../Pages/Homeworkdashboard.jsx';
import HomeworkSubmissions        from '../Pages/Homeworksubmission.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Frontpage/>} />
          <Route path="/login" element={<LoginForm/>} />
          <Route path="/register" element={<Signup/>} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard/>} />
          <Route path="/student-dashboard" element={<StudentDashboard/>} />
          <Route path="/homework-dashboard/:hwId" element={<HomeworkDashboard/>} />
          <Route path="/teacher/homework/:hwId/submissions" element={<HomeworkSubmissions/>} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
