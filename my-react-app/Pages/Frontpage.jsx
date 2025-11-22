// src/components/Frontpage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Footer.css';  // only footer css is used, keep it

const Frontpage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg fixed-top" style={styles.navbar}>
        <div className="container-fluid">

          <a className="navbar-brand" style={styles.brand}>Edutask</a>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarScroll">

            {/* LEFT LINKS */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">

              <li className="nav-item">
                <a className="nav-link" style={styles.navLink} onClick={() => navigate('/Home')}>
                  Home
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link" style={styles.navLink} onClick={() => navigate('/About')}>
                  About
                </a>
              </li>

            </ul>

            {/* RIGHT LINKS */}
            <ul className="navbar-nav mb-2 mb-lg-0" style={{ margin: "10px" }}>

              <li className="nav-item">
                <a className="nav-link" style={styles.navLink} onClick={() => navigate('/Login')}>
                  Login
                </a>
              </li>

              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={styles.navLink}
                >
                  Register
                </a>

                <ul className="dropdown-menu" style={{ width: "140px" }}>
                  <li>
                    <a className="dropdown-item" onClick={() => navigate('/register')}>
                       Student/Teacher
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






// FOOTER COMPONENT
const Footer = () => {
  return (
    <footer className="footer" style={{ marginTop: "500px" }}>
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

          <div className="footer-col"></div>

          <div className="footer-col">
            <h4>Follow Us</h4>
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





// ===================== INLINE STYLES ===================== //
const styles = {
  container: {
    height: "100vh",
    width: "100%",
     paddingBottom: "200px",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  navbar: {
    backgroundColor: "#064420",        // Dark green
    borderBottom: "2px solid #032d14",
  },

  brand: {
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  navLink: {
    color: "white",
    cursor: "pointer",
  },
};

export { Frontpage, Footer };
