// src/components/Frontpage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Footer.css';

const Frontpage = () => {
  const navigate = useNavigate();

  return (
  <div style={styles.container}>
  <nav className="navbar navbar-expand-lg bg-body-tertiary fixed-top bg-dark border-bottom border-body" data-bs-theme="dark">
    <div className="container-fluid">
      <a className="navbar-brand">MyApp</a>

      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarScroll">
        {/* Left side - Home & Signup */}
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <a className="nav-link" onClick={() => navigate('/Home')}>Home</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" onClick={() => navigate('/About')}>About</a>
          </li>
        </ul>

        {/* Right side - Login */}
        <ul className="navbar-nav mb-2 mb-lg-0" style={{ margin: '10px'}}>
          <li className="nav-item">
            <a className="nav-link" onClick={() => navigate('/Login')}>Login</a>
          </li>
          <li className="nav-item dropdown">
  <a
    className="nav-link dropdown-toggle"
    href="#"
    role="button"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
    Register
  </a>
  <ul className="dropdown-menu" style={{width:"65px"}}>
    <li>
      <a className="dropdown-item" onClick={() => navigate('/register')}>
        As a Doctor
      </a>
    </li>
  </ul>
</li>
        </ul>
      </div>
    </div>
  </nav>
</div>

  );
};

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Our Services</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Affiliate Program</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Get Help</h4>
            <ul>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            
          </div>
          <div className="footer-col">
            <h4>Follow us</h4>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};



const styles = {
  container: {
    height: "200vh",
    display: "flex",
    justifyContent: "center",  
    alignItems: "center",      
    backgroundColor: "#f2f2f2",
  },
  form: {
    padding: "20px",
    backgroundColor: "white",
    boxShadow: "0 0 10px rgba(7, 8, 3, 0.1)",
    borderRadius: "8px"
  }
};









export { Frontpage, Footer };
