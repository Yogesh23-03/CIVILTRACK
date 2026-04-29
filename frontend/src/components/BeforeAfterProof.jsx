import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, CheckCircle, Clock, Camera, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BeforeAfterProof.css';

const BeforeAfterProof = ({ issue, onProofUpload }) => {
  const { user } = useAuth();
  const [showAfterImage, setShowAfterImage] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleProofUpload = async () => {
    // In real implementation, this would upload to server
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      if (onProofUpload) onProofUpload();
    }, 1500);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'authority';

  return (
    <div className="before-after-card glass">
      <div className="section-header">
        <Camera size={18} />
        <h4>Before & After Resolution</h4>
      </div>

      <div className="comparison-container">
        {/* Before Image */}
        <div className="image-panel before">
          <div className="image-label">⚠️ BEFORE</div>
          <div className="image-placeholder">
            {issue.beforeImage ? (
              <img src={issue.beforeImage} alt="Before" />
            ) : (
              <div className="placeholder-content">
                <Image size={40} />
                <span>Complaint submitted</span>
                <small>{new Date(issue.createdAt).toLocaleDateString()}</small>
              </div>
            )}
          </div>
          <div className="image-caption">
            Issue reported by {issue.complaintCount} citizens
          </div>
        </div>

        {/* After Image */}
        <div className="image-panel after">
          <div className="image-label">✅ AFTER</div>
          <div className="image-placeholder">
            {issue.afterImage ? (
              <img src={issue.afterImage} alt="After" />
            ) : (
              <div className="placeholder-content">
                {issue.status === 'Pending Verification' ? (
                  <>
                    <Clock size={40} />
                    <span>Awaiting verification</span>
                    <small>Resolution submitted - pending community review</small>
                  </>
                ) : issue.status === 'Verified' ? (
                  <>
                    <CheckCircle size={40} />
                    <span>Resolved & Verified</span>
                    <small>Community confirmed resolution</small>
                  </>
                ) : (
                  <>
                    <Camera size={40} />
                    <span>Resolution pending</span>
                    <small>Authority will upload proof</small>
                  </>
                )}
              </div>
            )}
          </div>
          {issue.afterImage && (
            <div className="image-caption">
              Resolution note: {issue.resolutionNote || 'Issue resolved'}
            </div>
          )}
        </div>
      </div>

      {/* Admin Upload Section */}
      {isAdmin && issue.status !== 'Verified' && (
        <div className="admin-upload">
          <div className="upload-area">
            <Upload size={20} />
            <span>Upload resolution proof (after image)</span>
            <button 
              className="upload-btn"
              onClick={handleProofUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Proof'}
            </button>
          </div>
        </div>
      )}

      {issue.resolutionNote && (
        <div className="resolution-note">
          <div className="note-header">
            <span>📝 Authority Note</span>
          </div>
          <p>{issue.resolutionNote}</p>
          <div className="note-footer">
            <span>Resolution submitted: {new Date(issue.resolvedAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeforeAfterProof;