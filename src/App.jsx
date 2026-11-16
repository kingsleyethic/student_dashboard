 import Profile from "./components/Profile.jsx";
 import Navbar from "./components/Navbar.jsx";
 import Course from "./components/Course.jsx";
import Footer from "./components/Footer.jsx";
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <h1>My Dashboard</h1>
      <Profile />
      <Course />
      <Footer />
      
    </div>
  );
}

export default App;