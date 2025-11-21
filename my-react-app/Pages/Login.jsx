import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed.');
      }

      localStorage.setItem('token', data.token);
      const decoded = jwtDecode(data.token);
      const role = decoded.role || data.user?.role;

      if (role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      alert(err.message || 'An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.cardWrapper}>
        <form className="w-100" onSubmit={handleSubmit}>
          <h2 className="text-center mb-4">Login</h2>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              aria-describedby="emailHelp"
              required
            />
            <div id="emailHelp" className="form-text">
              We'll never share your email with anyone else.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div className="form-text mt-1">
              <a href="/forgot-password" style={{ color: '#0d6efd' }}>
                Forgot Password?
              </a>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '200vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: '20px',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: '400px',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
};

export default LoginForm;
