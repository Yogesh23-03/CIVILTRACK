import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import DuplicateWarningModal from '../components/DuplicateWarningModal';
import { 
  Send, ArrowLeft, MapPin, Image as ImageIcon, 
  ChevronRight, ChevronLeft, AlertCircle, CheckCircle,
  Clock, Zap, Shield, FileText, User, Phone, Home
} from 'lucide-react';
import './ReportComplaint.css';

const ReportComplaint = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [pendingComplaintData, setPendingComplaintData] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Roads',
    location: '',
    ward: '',
    severity: 'medium'
  });

  const categories = [
    { value: 'Roads', label: 'Roads & Infrastructure', icon: <Zap size={20} />, color: '#4f46e5' },
    { value: 'Sanitation', label: 'Sanitation & Waste', icon: <Shield size={20} />, color: '#10b981' },
    { value: 'Water', label: 'Water Supply', icon: <Clock size={20} />, color: '#3b82f6' },
    { value: 'Electricity', label: 'Electricity & Lights', icon: <AlertCircle size={20} />, color: '#f59e0b' },
    { value: 'Other', label: 'Other Issues', icon: <FileText size={20} />, color: '#8b5cf6' }
  ];

  const wards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  const severityOptions = [
    { value: 'low', label: 'Low', icon: <CheckCircle size={16} />, color: '#10b981', desc: 'Non-urgent issue' },
    { value: 'medium', label: 'Medium', icon: <Clock size={16} />, color: '#f59e0b', desc: 'Causing inconvenience' },
    { value: 'high', label: 'High', icon: <AlertCircle size={16} />, color: '#f97316', desc: 'Urgent attention needed' },
    { value: 'critical', label: 'Critical', icon: <Zap size={16} />, color: '#ef4444', desc: 'Emergency situation' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const buildComplaintData = () => ({
    title: formData.title,
    description: formData.description,
    category: formData.category,
    location: {
      address: formData.location,
      ward: formData.ward
    },
    severity: formData.severity,
    imageUrl: uploadedImage
  });

  const submitComplaint = async (complaintData) => {
    await apiService.createComplaint(complaintData);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const complaintData = buildComplaintData();
      const duplicate = await apiService.checkDuplicateComplaint({
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        ward: complaintData.location.ward
      });

      if (duplicate?.isDuplicate) {
        setPendingComplaintData(complaintData);
        setDuplicateWarning(duplicate);
        return;
      }

      await submitComplaint(complaintData);
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => categories.find(c => c.value === formData.category);

  return (
    <div className="report-page">
      {duplicateWarning && (
        <DuplicateWarningModal
          duplicate={duplicateWarning}
          loading={loading}
          onClose={() => {
            setDuplicateWarning(null);
            setPendingComplaintData(null);
            setLoading(false);
          }}
          onUpvote={async () => {
            try {
              await apiService.upvoteIssue(duplicateWarning.existingIssue.id);
              navigate('/dashboard');
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to upvote existing issue.');
            } finally {
              setLoading(false);
            }
          }}
          onContinue={async () => {
            try {
              await submitComplaint(pendingComplaintData);
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to submit complaint.');
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
      {/* Animated Background */}
      <div className="report-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb2"></div>
        <div className="gradient-orb3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="report-container">
        <motion.div 
          className="report-card glass"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Details</span>
            </div>
            <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Location</span>
            </div>
            <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>Submit</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Issue Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <div className="step-header">
                    <h2>Report an Issue</h2>
                    <p>Help us improve your city</p>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <div className="category-grid">
                      {categories.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          style={{ '--cat-color': cat.color }}
                        >
                          {cat.icon}
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Issue Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Brief description of the problem"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      rows="4"
                      placeholder="Provide detailed information..."
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Severity Level</label>
                    <div className="severity-grid">
                      {severityOptions.map(sev => (
                        <button
                          key={sev.value}
                          type="button"
                          className={`severity-btn ${formData.severity === sev.value ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, severity: sev.value })}
                        >
                          <div className="severity-icon" style={{ color: sev.color }}>{sev.icon}</div>
                          <div>
                            <div className="severity-label">{sev.label}</div>
                            <div className="severity-desc">{sev.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Upload Photo (Optional)</label>
                    <div className="image-upload" onClick={() => document.getElementById('imageInput').click()}>
                      {uploadedImage ? (
                        <div className="image-preview">
                          <img src={uploadedImage} alt="Preview" />
                          <button type="button" className="remove-image" onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                          }}>✕</button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <ImageIcon size={32} />
                          <p>Click to upload an image</p>
                          <span>PNG, JPG up to 5MB</span>
                        </div>
                      )}
                      <input id="imageInput" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </div>
                  </div>

                  <button type="button" className="next-btn" onClick={nextStep}>
                    Continue <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <div className="step-header">
                    <h2>Where is this issue?</h2>
                    <p>Help us locate the problem</p>
                  </div>

                  <div className="form-group">
                    <label>Ward Number</label>
                    <select name="ward" value={formData.ward} onChange={handleChange} required>
                      <option value="">Select Ward</option>
                      {wards.map(ward => (
                        <option key={ward} value={ward}>Ward {ward}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Street name or landmark"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="button-group">
                    <button type="button" className="prev-btn" onClick={prevStep}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button type="button" className="next-btn" onClick={nextStep}>
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="step-content"
                >
                  <div className="step-header">
                    <h2>Review & Submit</h2>
                    <p>Verify the information before submitting</p>
                  </div>

                  <div className="review-section">
                    <div className="review-group">
                      <h3>Issue Details</h3>
                      <div className="review-item">
                        <strong>Category:</strong>
                        <span>{getSelectedCategory()?.label}</span>
                      </div>
                      <div className="review-item">
                        <strong>Title:</strong>
                        <span>{formData.title}</span>
                      </div>
                      <div className="review-item">
                        <strong>Description:</strong>
                        <span>{formData.description}</span>
                      </div>
                      <div className="review-item">
                        <strong>Severity:</strong>
                        <span>{severityOptions.find(s => s.value === formData.severity)?.label}</span>
                      </div>
                    </div>

                    <div className="review-group">
                      <h3>Location</h3>
                      <div className="review-item">
                        <strong>Ward:</strong>
                        <span>Ward {formData.ward}</span>
                      </div>
                      <div className="review-item">
                        <strong>Address:</strong>
                        <span>{formData.location}</span>
                      </div>
                    </div>

                    {uploadedImage && (
                      <div className="review-group">
                        <h3>Attached Image</h3>
                        <img src={uploadedImage} alt="Attached" className="review-image" />
                      </div>
                    )}
                  </div>

                  <div className="button-group">
                    <button type="button" className="prev-btn" onClick={prevStep}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? (
                        <div className="btn-loader"></div>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Submit Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportComplaint;
