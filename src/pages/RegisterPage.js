import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from "../firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';

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
    "Uttar Pradesh": { districts:{
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
      Ghaziabad: ["Ghaziabad City", "Loni"] } },
    "Maharashtra": { districts: { Mumbai: ["Andheri", "Borivali", "Dadar"] } },
    "Delhi": { districts: { "New Delhi": ["Connaught Place", "Karol Bagh"] } },
    "Karnataka": { districts: { Bengaluru: ["Whitefield", "Koramangala"] } },
    "Tamil Nadu": { districts: { Chennai: ["Anna Nagar", "T. Nagar"] } },
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), { fullName, email, phone, state, district, city, address, createdAt: new Date() });
      navigate("/profile");
    } catch (err) {
      setError("Registration failed. Try again.");
      console.error(err);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), { fullName: user.displayName || "", email: user.email, phone: user.phoneNumber || "", state: "", district: "", city: "", address: "", createdAt: new Date() });
      navigate("/profile");
    } catch (err) {
      console.error("Social login failed", err);
      setError("Social login failed.");
    }
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
            <button className="google-btn" onClick={() => handleSocialLogin(new GoogleAuthProvider())}>
              <img src="https://img.icons8.com/color/16/google-logo.png" alt="Google" /> Google
            </button>
            <button className="facebook-btn" onClick={() => handleSocialLogin(new FacebookAuthProvider())}>
              <img src="https://img.icons8.com/ios-filled/16/ffffff/facebook--v1.png" alt="Facebook" /> Facebook
            </button>
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
