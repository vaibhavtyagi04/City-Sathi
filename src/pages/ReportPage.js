import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiMapPin,
  FiLoader,
  FiUploadCloud,
  FiCamera,
  FiX,
  FiCpu,
  FiAlertTriangle
} from "react-icons/fi";
import Webcam from "react-webcam";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReportPage.css";
import report from "../assets/report.jpg";
import { API_URL } from "../config";
import { toast } from "react-toastify";
import imageCompression from 'browser-image-compression';

const ADD_WATERMARK = true; // Feature flag

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

  // AI Prediction State
  const [aiPrediction, setAiPrediction] = useState(null); // { category, confidence }
  const [isPredicting, setIsPredicting] = useState(false);
  const [aiVerified, setAiVerified] = useState(false);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = React.useRef(null);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(async blob => {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

          const watermarkedFile = await addWatermark(file, location, address);

          setImage(watermarkedFile);
          setImagePreview(URL.createObjectURL(watermarkedFile));
          setShowCamera(false);
          setError("");
          
          // Trigger AI Prediction
          runAiPrediction(watermarkedFile);
        });
    }
  }, [webcamRef, location, address]);

  // Auto-detect location
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
    if (file.size > 10 * 1024 * 1024) { // 10MB limit on server
      setError("Image must be under 10 MB.");
      return;
    }
    const processFile = async () => {
      try {
        setSubmitting(true);
        setError("Compressing image...");
        
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1280,
          useWebWorker: true
        };
        
        const compressedFile = await imageCompression(file, options);
        const watermarkedFile = await addWatermark(compressedFile, location, address);
        
        setImage(watermarkedFile);
        setImagePreview(URL.createObjectURL(watermarkedFile));
        setError("");
        
        // Trigger AI Prediction
        runAiPrediction(watermarkedFile);

      } catch (err) {
        console.error("Processing error:", err);
        setError("Error processing image.");
        toast.error("Failed to process image");
      } finally {
        setSubmitting(false);
      }
    };

    processFile();
  };

  const runAiPrediction = async (fileToAnalyze) => {
    try {
      setIsPredicting(true);
      setAiPrediction(null);
      setAiVerified(false);
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', fileToAnalyze);
      
      const res = await fetch(`${API_URL}/ai/predict`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // If confidence is extremely low (< 5%), we treat it as an unconfident match
        if (data.confidence > 0.05) {
            setAiPrediction(data);
            
            // If very confident, suggest the category immediately and inject the description
            if (data.confidence > 0.1 && data.category !== 'other') {
                setCategory(data.category);
                
                // Only overwrite description if the user hasn't typed a custom one yet, 
                // or if it's currently empty
                if (!description.trim()) {
                    setDescription(data.description || '');
                }
            }
        }
      }
    } catch (err) {
      console.error("AI Prediction failed silently:", err);
      // We don't want to block the user if AI fails, just degrade gracefully
    } finally {
      setIsPredicting(false);
    }
  };

  const addWatermark = (file, loc, addr) => {
    return new Promise((resolve, reject) => {
      if (!file) return reject("No file");

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        console.log("Watermark: Image loaded, dimensions:", img.width, img.height);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original
        ctx.drawImage(img, 0, 0);

        // Watermark Config
        const fontSize = Math.max(24, Math.floor(canvas.width * 0.03));
        const lineHeight = fontSize * 1.3;
        const padding = fontSize;

        // Calculate text
        const dateStr = new Date().toLocaleString();
        const locStr = loc ? `Lat: ${loc.lat.toFixed(5)}, Lng: ${loc.lng.toFixed(5)}` : "Location: Not detected";
        const addrStr = addr || "Address: Not detected";

        // Prepare lines (bottom-up)
        const lines = [dateStr, locStr];

        // Wrap address simple
        const maxTextWidth = canvas.width - (padding * 2);
        ctx.font = `bold ${fontSize}px sans-serif`;

        // Split address into lines if needed
        const words = addrStr.split(' ');
        let currentLine = '';
        const addrLines = [];

        words.forEach(word => {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && currentLine !== '') {
            addrLines.push(currentLine);
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        });
        addrLines.push(currentLine);

        // Add address lines (reversed for bottom-up drawing logic)
        // Actually easier to just concat all lines and draw background based on total height
        const allLines = [...addrLines, ...lines]; // Address first, then coords, then date

        const totalTextHeight = allLines.length * lineHeight + padding;

        // Draw Background Overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, canvas.height - totalTextHeight - padding, canvas.width, totalTextHeight + padding);

        // Draw Text
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "bottom";

        let y = canvas.height - padding;

        // Draw date (last item)
        ctx.fillText(dateStr, padding, y);
        y -= lineHeight;

        // Draw coords
        ctx.fillText(locStr, padding, y);
        y -= lineHeight;

        // Draw address lines (bottom-up)
        for (let i = addrLines.length - 1; i >= 0; i--) {
          ctx.fillText(addrLines[i], padding, y);
          y -= lineHeight;
        }

        canvas.toBlob(blob => {
          if (blob) {
            const newFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject("Canvas to Blob failed");
          }
          URL.revokeObjectURL(objectUrl);
        }, "image/jpeg", 0.95);
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };
    });
  };

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
    const token = localStorage.getItem('token');
    if (!token) {
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
    // Multer upload is one-shot, fake progress or just wait
    setUploadProgress(50);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('location', JSON.stringify({
        lat: location?.lat,
        lng: location?.lng,
        address: address,
      }));
      
      // Append AI feedback data
      if (aiPrediction) {
          formData.append('aiDetectedCategory', aiPrediction.category);
          formData.append('aiConfidence', aiPrediction.confidence);
          // If the submitted category matches the AI's highest confidence category, it's AI verified
          formData.append('aiVerified', category === aiPrediction.category ? 'true' : 'false');
          // Attach the system description if it generated one
          if (aiPrediction.description) {
              formData.append('aiGeneratedDescription', aiPrediction.description);
          }
      }

      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to submit report');
      }

      setUploadProgress(100);
      setSuccess(true);
      toast.success('Report submitted — thank you!');
      setTimeout(() => {
        navigate("/reports");
      }, 1500);

    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit report. " + err.message);
      setSubmitting(false);
      setUploadProgress(0);
    }
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
                  className={`category-chip ${category === c.key ? "active" : ""
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

            {/* CAMERA MODAL */}
            {showCamera && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', background: '#000', padding: '10px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCamera(false)}
                    style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
                  >
                    <FiX />
                  </button>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={capture}
                    style={{ width: '100%', padding: '12px', marginTop: '10px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <FiCamera style={{ marginRight: '5px' }} /> Capture
                  </button>
                </div>
              </div>
            )}

            {/* IMAGE UPLOAD (click or drag-drop) */}
            <div className="upload-actions" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <label
                className="upload-box"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{ flex: 1 }}
              >
                <FiUploadCloud size={22} />
                <div>
                  <div className="upload-text">
                    {image ? "Change Photo" : "Upload File"}
                  </div>
                  <div className="upload-subtext">
                    JPG / PNG · Max 6 MB
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>

              <button
                type="button"
                className="camera-btn"
                onClick={() => setShowCamera(true)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', border: '2px dashed #cbd5e0', borderRadius: '8px', cursor: 'pointer', color: '#4a5568' }}
              >
                <FiCamera size={22} />
                <span style={{ fontWeight: '600', marginTop: '5px' }}>Take Photo</span>
              </button>
            </div>

            {imagePreview && (
              <div className="preview-wrap" style={{ position: 'relative', marginBottom: "15px" }}>
                <img src={imagePreview} alt="preview" className="preview-image" style={{ width: '100%', borderRadius: '8px' }} />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    setAiPrediction(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FiX />
                </button>
                
                {/* AI Prediction Overlay Box */}
                {(isPredicting || aiPrediction) && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(255,255,255,0.95)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'flex-start', gap: '12px', backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: isPredicting ? '#ebf4ff' : aiPrediction?.confidence < 0.1 ? '#fff5f5' : '#f0fff4', color: isPredicting ? '#3182ce' : aiPrediction?.confidence < 0.1 ? '#e53e3e' : '#38a169', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isPredicting ? <FiLoader className="spinner" size={20} /> : aiPrediction?.confidence < 0.1 ? <FiAlertTriangle size={20} /> : <FiCpu size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            {isPredicting ? (
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#2d3748' }}>Smart Vision Analysis...</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>Detecting issue severity and type.</p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#2d3748' }}>
                                        {aiPrediction?.confidence < 0.1 ? 'Unclear Image Detected' : `AI Suggestion: ${(aiPrediction?.category || '').replace('_', ' ')}`}
                                    </p>
                                    {aiPrediction?.confidence < 0.1 ? (
                                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#e53e3e', fontWeight: '500' }}>Please ensure the issue is clearly visible in the frame to help municipalities.</p>
                                    ) : (
                                        <div>
                                            <p style={{ margin: '2px 0 6px 0', fontSize: '12px', color: '#718096' }}>We've auto-selected the category based on this image ({(aiPrediction?.confidence * 100).toFixed(0)}% match).</p>
                                            {category === aiPrediction?.category ? (
                                                <span style={{ fontSize: '11px', background: '#c6f6d5', color: '#22543d', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Verified Match</span>
                                            ) : (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setCategory(aiPrediction.category)}
                                                    style={{ fontSize: '11px', background: '#edf2f7', color: '#4a5568', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                                                >
                                                    Switch to {aiPrediction.category.replace('_', ' ')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
