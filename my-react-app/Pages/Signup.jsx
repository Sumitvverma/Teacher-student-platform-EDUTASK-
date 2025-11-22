import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.authtoken);
        navigate('/login');
      } else {
        alert(data.error || data.message || 'Signup failed.');
      }
    } catch (err) {
      console.error('Error signing up:', err);
      alert('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Name */}
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            type="text"
            className="form-control"
            required
          />
        </div>
        {/* Email */}
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            className="form-control"
            required
          />
        </div>
        {/* Password */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            className="form-control"
            required
          />
        </div>
        {/* Role Select */}
        <div className="mb-3">
          <label className="form-label">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn w-100"
  style={{
    backgroundColor: "#064420",
    color: "white",
    border: "none"
  }}>
          Submit
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    height: '200vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  form: {
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    width: '500px',
  }
};

export default Signup;
