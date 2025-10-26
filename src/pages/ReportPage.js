// ReportPage.jsx
import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import {
  FiCamera,
  FiCheckCircle,
  FiMapPin,
  FiLoader,
  FiUploadCloud,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReportPage.css";
import report from "../assets/report.jpg";
const CATEGORIES = [
  { key: "garbage", label: "Garbage" },
  { key: "stray_animal", label: "Stray Animal" },
  { key: "street_light", label: "Street Light" },
  { key: "pothole", label: "Pothole" },
  { key: "drainage", label: "Drainage" },
  { key: "other", label: "Other" },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("garbage");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [location, setLocation] = useState(null); // {lat, lng}
  const [address, setAddress] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-detect location + reverse geocode via OpenStreetMap's Nominatim
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationEnabled(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          if (data?.display_name) setAddress(data.display_name);
        } catch (err) {
          console.warn("Reverse geocode failed:", err);
        } finally {
          setLocationEnabled(true);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocationEnabled(false);
      }
    );
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG/PNG images allowed.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Image must be under 6 MB.");
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  // Allow simple drag & drop into the label area
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvt = { target: { files: [file] } };
      handleImageChange(fakeEvt);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }
    if (!description.trim()) {
      setError("Please add a description.");
      return;
    }
    if (!address && !location) {
      setError("Location missing.");
      return;
    }
    if (!image) {
      setError("Please attach an image.");
      return;
    }

    setSubmitting(true);
    setError("");
    setUploadProgress(0);

    try {
      // Upload image with resumable upload to monitor progress
      const imageRef = ref(storage, `reports/${Date.now()}_${image.name}`);
      const uploadTask = uploadBytesResumable(imageRef, image);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(percent));
        },
        (uploadErr) => {
          console.error("Upload error:", uploadErr);
          setError("Image upload failed.");
          setSubmitting(false);
        },
        async () => {
          const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Save report doc
          await addDoc(collection(db, "reports"), {
            userId: auth.currentUser.uid,
            description: description.trim(),
            category,
            imageUrl,
            location: {
              lat: location?.lat || null,
              lng: location?.lng || null,
              address: address || null,
            },
            timestamp: serverTimestamp(),
          });

          setSuccess(true);
          setUploadingFinish();
        }
      );
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit report.");
      setSubmitting(false);
    }
  };

  const setUploadingFinish = () => {
    setSubmitting(false);
    setUploadProgress(100);
    setTimeout(() => {
      // reset or navigate
      navigate("/reportssection");
    }, 1500);
  };

  return (
    <>
      <Navbar />
      {/* ===== page background - change image path if you want =====
           Put your background file in public/ (easier) and change url below
           backgroundImage: `url("/bg-city.jpg")`
      */}
      <div
     style={{
    backgroundImage: `url(${report})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    height: "100vh",
  }}
      >
        <div className="report-container">
          <h2 className="report-heading">🧹 Report an Issue</h2>

          <form className="report-form" onSubmit={handleSubmit}>
            {/* CATEGORY CHOICES */}
            <div className="category-row">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  className={`category-chip ${
                    category === c.key ? "active" : ""
                  }`}
                  onClick={() => setCategory(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* DESCRIPTION */}
            <textarea
              className="report-textarea"
              placeholder="Describe the issue (what, when, why)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            {/* LOCATION DISPLAY / manual entry */}
            {locationEnabled === null ? (
              <div className="location-loading">
                <FiLoader className="spinner" /> Checking location...
              </div>
            ) : locationEnabled ? (
              <div className="location-success">
                <FiMapPin /> <strong>Detected:</strong>{" "}
                <span className="address-text">
                  {address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                </span>
                {/* Optional: allow user to edit detected address */}
                <input
                  className="report-input address-edit"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Edit detected address (optional)"
                />
              </div>
            ) : (
              <input
                className="report-input"
                type="text"
                placeholder="Enter location (e.g., street/area/city)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            )}

            {/* IMAGE UPLOAD (click or drag-drop) */}
            <label
              className="upload-box"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FiUploadCloud size={22} />
              <div>
                <div className="upload-text">
                  {image ? "Change Photo" : "Click or drop image here"}
                </div>
                <div className="upload-subtext">
                  JPG / PNG · Max 6 MB · Photo showing the issue clearly
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>

            {imagePreview && (
              <div className="preview-wrap">
                <img src={imagePreview} alt="preview" className="preview-image" />
              </div>
            )}

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
                <div className="progress-label">{uploadProgress}%</div>
              </div>
            )}

            {/* error / success messages */}
            {error && <p className="error-message">{error}</p>}
            {success && (
              <p className="success-message">
                <FiCheckCircle /> Report submitted — thank you!
              </p>
            )}

            {/* SUBMIT */}
            <button
              className="submit-btn"
              type="submit"
              disabled={submitting || uploadProgress > 0 && uploadProgress < 100}
            >
              {submitting ? (
                <>
                  <FiLoader className="spinner" /> Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </>
  );
}
