import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import loginbg from '../assets/log.jpg';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { toast } from 'react-toastify';

const GOOGLE_CLIENT_ID = "704438813882-r2nieunde5dd2dovpnjkpmg0q7r4evii.apps.googleusercontent.com"; // Replace with actual ID
const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID"; // Replace with actual ID

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSocialSuccess = async (provider, data) => {
    try {
      const endpoint = provider === 'google' ? '/auth/google' : '/auth/facebook';
      const body = provider === 'google'
        ? { token: data.credential }
        : { accessToken: data.accessToken, userID: data.userID };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || 'Social login failed');

      localStorage.setItem('token', result.token);
      toast.success('Login successful!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      localStorage.setItem('token', data.token);

      if (isAdminLogin) {
        if (data.user?.role === 'admin') {
          toast.success('Welcome Admin!');
          navigate('/admin');
        } else {
          toast.error('Access Denied: You do not have admin privileges.');
          localStorage.removeItem('token');
        }
      } else {
        toast.success('Login successful!');
        navigate('/profile');
      }
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        toast.error("Cannot connect to server. Is the backend running?");
      } else {
        toast.error(err.message);
      }
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
          <h2 style={styles.title}>Be a part in tackling the environment 🌍</h2>

          {/* Social Login Buttons */}
          <div style={styles.socialButtons}>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={credentialResponse => handleSocialSuccess('google', credentialResponse)}
                onError={() => toast.error('Google Login Failed')}
                useOneTap
              />
            </GoogleOAuthProvider>

            <div style={{ marginTop: 10 }}>
              <FacebookLogin
                appId={FACEBOOK_APP_ID}
                onSuccess={(response) => {
                  handleSocialSuccess('facebook', response);
                }}
                onFail={(error) => {
                  console.log('Login Failed!', error);
                   toast.error('Facebook Login Failed');
                }}
                style={{
                  backgroundColor: '#4267b2',
                  color: '#fff',
                  fontSize: '16px',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Login with Facebook
              </FacebookLogin>
            </div>
          </div>

          <div style={styles.divider}><span>OR</span></div>

          {/* Login Form */}
          <form style={styles.form} onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              style={styles.input}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                style={styles.input}
                onChange={handleChange}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Admin Login Toggle */}
            <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={isAdminLogin}
                  onChange={(e) => setIsAdminLogin(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Login as Admin
              </label>
            </div>

            {/* {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>} */}

            <div style={styles.optionsRow}>
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <a href="/forgot-password" style={styles.link}>Forgot Password?</a>
            </div>

            <button type="submit" style={styles.loginButton} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={styles.footerText}>
            Don’t have an account? <a href="/register" style={styles.link}>Register</a>
          </p>
        </div>
      </div>
    </>
  );
};

/* ---------- Styles ---------- */
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
    fontSize: '22px',
    marginBottom: '25px',
    fontWeight: '600',
  },
  socialButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  socialBtn: {
    color: 'white',
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: '18px',
  },
  divider: {
    margin: '20px 0',
    textAlign: 'center',
    color: '#ddd',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  input: {
    padding: '10px',
    marginTop: '8px',
    marginBottom: '16px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: '10px',
    top: '35%',
    cursor: 'pointer',
    color: '#333',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '15px',
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
    marginTop: '20px',
    fontSize: '14px',
  },
  link: {
    color: '#38b2ac',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default LoginPage;
