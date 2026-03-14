import { useState } from 'react';
import Navbar from '../components/Navbar';
import loginbg from '../assets/log.jpg';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warn('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Failed to send OTP');
      }

      toast.success('OTP sent successfully!');
      setOtpSent(true);
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

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.warn('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Invalid OTP');
      }

      localStorage.setItem('token', data.token);
      toast.success('Login successful!');
      navigate('/profile');
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
          <h2 style={styles.title}>CitySathi Login</h2>

          {!otpSent ? (
            <form style={styles.form} onSubmit={handleSendOTP}>
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" style={styles.loginButton} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form style={styles.form} onSubmit={handleVerifyOTP}>
              <label>Email</label>
              <input
                type="email"
                style={{...styles.input, backgroundColor: '#eee', cursor: 'not-allowed'}}
                value={email}
                disabled
              />
              
              <label>OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                style={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <button type="submit" style={styles.loginButton} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <p style={styles.resendText}>
                Didn't receive OTP?{' '}
                <span style={styles.link} onClick={handleSendOTP}>
                  Resend
                </span>
              </p>
            </form>
          )}

          <p style={styles.footerText}>
            No password required. A secure OTP will be sent to your email.
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
  resendText: {
    marginTop: '15px',
    fontSize: '14px',
    textAlign: 'center'
  },
  footerText: {
    marginTop: '25px',
    fontSize: '13px',
    opacity: 0.8
  },
  link: {
    color: '#81e6d9',
    textDecoration: 'underline',
    fontWeight: '600',
    cursor: 'pointer'
  },
};

export default LoginPage;
