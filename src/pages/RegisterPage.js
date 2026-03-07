import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
// Firebase imports removed
import { API_URL } from '../config';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // Replace with actual ID
const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID"; // Replace with actual ID

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
    city: "",
    address: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const states = ["Uttar Pradesh", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"];
  const stateDistrictCityData = {
    "Uttar Pradesh": {
      districts: {
        Agra: ["Agra City", "Fatehabad"],
        Aligarh: ["Aligarh City", "Khair"],
        Mathura: ["Mathura City", "Vrindavan"],
        Bareilly: ["Bareilly City", "Aonla"],
        Moradabad: ["Moradabad City", "Thakurdwara"],
        Gorakhpur: ["Gorakhpur City", "Sadar"],
        Lucknow: ["Lucknow City", "Alambagh"],
        Varanasi: ["Varanasi City", "Sarnath"],
        Kanpur: ["Kanpur City", "Kalyanpur"],
        Jhansi: ["Jhansi City", "Tehri"],
        Saharanpur: ["Saharanpur City", "Nakud"],
        Mathura: ["Mathura City", "Chhata"],
        Etawah: ["Etawah City", "Bharthana"],
        Firozabad: ["Firozabad City", "Shikohabad"],
        Rampur: ["Rampur City", "Bilaspur"],
        Shahjahanpur: ["Shahjahanpur City", "Tilhar"],
        Sitapur: ["Sitapur City", "Misrikh"],
        Deoria: ["Deoria City", "Bhatpar Rani"],
        Hapur: ["Hapur"],
        Sambhal: ["Sambhal City", "Chandausi"],
        Meerut: ["Meerut City", "Modipuram"],
        Bulandshahr: ["Bulandshahr City", "Siana"],
        Jaunpur: ["Jaunpur City", "Shahganj"],
        Mirzapur: ["Mirzapur City", "Chunar"],
        Badaun: ["Badun City", "Kachhla"],
        Ghaziabad: ["Ghaziabad City", "Loni"]
      }
    },
    "Maharashtra": { districts: { Mumbai: ["Andheri", "Borivali", "Dadar"] } },
    "Delhi": { districts: { "New Delhi": ["Connaught Place", "Karol Bagh"] } },
    "Karnataka": { districts: { Bengaluru: ["Whitefield", "Koramangala"] } },
    "Tamil Nadu": { districts: { Chennai: ["Anna Nagar", "T. Nagar"] } },
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
      if (!res.ok) throw new Error(result.msg || 'Social registration failed');

      localStorage.setItem('token', result.token);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStateChange = (state) => {
    setFormData((prev) => ({ ...prev, state, district: "", city: "" }));
    setDistricts(Object.keys(stateDistrictCityData[state]?.districts || {}));
    setCities([]);
  };
  const handleDistrictChange = (district) => {
    setFormData((prev) => ({ ...prev, district, city: "" }));
    const stateData = stateDistrictCityData[formData.state];
    if (stateData && stateData.districts[district]) {
      setCities(stateData.districts[district]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, password, confirmPassword, state, district, city, address, phone } = formData;
    if (!fullName || !email || !password || !confirmPassword || !state || !district || !city || !address || !phone) {
      setError("Please fill all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      if (err.message === 'Failed to fetch') {
        setError("Cannot connect to server. Is the backend running?");
      } else {
        setError(err.message);
      }
    }
  };

  const handleSocialLogin = async (provider) => {
    setError("Social login not supported in this version yet.");
  };

  return (
    <>
      <Navbar />
      <div className="register-bg">
        <div className="register-container">
          <h2>Register to CitySathi</h2>
          <form className="register-form" onSubmit={handleSubmit}>
            <input type="text" name="fullName" placeholder="Full Name" onChange={handleChange} />
            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} />
            <input type="tel" name="phone" placeholder="Phone Number" onChange={handleChange} />

            <select name="state" value={formData.state} onChange={(e) => handleStateChange(e.target.value)}>
              <option value="">Select State</option>
              {states.map((state, index) => <option key={index} value={state}>{state}</option>)}
            </select>

            <select name="district" value={formData.district} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!formData.state}>
              <option value="">Select District</option>
              {districts.map((district, index) => <option key={index} value={district}>{district}</option>)}
            </select>

            <select name="city" value={formData.city} onChange={handleChange} disabled={!formData.district}>
              <option value="">Select City</option>
              {cities.map((city, index) => <option key={index} value={city}>{city}</option>)}
            </select>

            <input type="text" name="address" placeholder="Address" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} />
            <button type="submit">Register</button>
          </form>

          <div className="social-login">
            <p>Or Sign Up Using</p>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={credentialResponse => handleSocialSuccess('google', credentialResponse)}
                onError={() => setError('Google Registration Failed')}
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
                  console.log('Registration Failed!', error);
                  setError('Facebook Registration Failed');
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
                Register with Facebook
              </FacebookLogin>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
        </div>
      </div>

      <style jsx="true">{`
        .register-bg {
          background: url('/images/register-bg.png') no-repeat center center/cover;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .register-container {
          max-width: 500px;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          text-align: center;
          animation: fadeIn 1s ease-in-out;
        }
        .register-container h2 {
          margin-bottom: 20px;
          font-size: 24px;
          color: #2c3e50;
        }
        .register-form input, .register-form select {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
        }
        .register-form button {
          width: 100%;
          padding: 12px;
          background: #2c7a7b;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 10px;
        }
        .register-form button:hover {
          background: #226568;
        }
        .social-login {
          margin-top: 20px;
        }
        .social-login button {
          width: 100%;
          padding: 10px;
          margin: 5px 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
        }
        .google-btn { background: #4285F4; color: white; }
        .facebook-btn { background: #3b5998; color: white; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default RegisterPage;
