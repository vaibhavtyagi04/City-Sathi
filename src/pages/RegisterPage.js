import { useState } from 'react';
import Navbar from '../components/Navbar';
import loginbg from '../assets/log.jpg';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.warn('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      toast.success('Registration successful!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.overlay}></div>
        <div style={styles.loginBox}>
          <h2 style={styles.title}>Join CitySathi</h2>
          <form style={styles.form} onSubmit={handleRegister}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              style={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" style={styles.loginButton} disabled={loading}>
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>

          <p style={styles.footerText}>
            Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
          </p>
        </div>
      </div>
    </>
  );
};

/* ---------- Styles (Shared with Login) ---------- */
const styles = {
  container: {
    backgroundImage: `url(${loginbg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  loginBox: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(12px)',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    zIndex: 2,
    color: 'white',
  },
  title: {
    fontSize: '24px',
    marginBottom: '25px',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  input: {
    padding: '12px',
    marginTop: '8px',
    marginBottom: '16px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    color: '#333'
  },
  loginButton: {
    backgroundColor: '#319795',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
    transition: 'all 0.3s ease',
  },
  footerText: {
    marginTop: '25px',
    fontSize: '14px',
    opacity: 0.8
  },
  link: {
    color: '#81e6d9',
    textDecoration: 'underline',
    fontWeight: '600',
    cursor: 'pointer'
  },
};

export default RegisterPage;
