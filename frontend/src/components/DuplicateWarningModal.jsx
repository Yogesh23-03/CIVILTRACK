import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, ThumbsUp, TrendingUp, MapPin, 
  X, ArrowRight, CheckCircle, Flame
} from 'lucide-react';

const DuplicateWarningModal = ({ duplicate, onUpvote, onContinue, onClose, loading }) => {
  const { existingIssue, similarity } = duplicate;
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="duplicate-modal-overlay" onClick={onClose}>
      <motion.div 
        className="duplicate-modal glass"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-icon">⚠️</div>
        <h3>Similar Issue Already Exists!</h3>
        <p>We found an existing issue that matches your description</p>

        {/* Similarity Badge */}
        <div className="similarity-badge">
          <AlertTriangle size={14} />
          <span>{Math.round(similarity * 100)}% match with existing issue</span>
        </div>

        {/* Existing Issue Details */}
        <div className="existing-issue-card">
          <div className="issue-header">
            <div className="issue-category">{existingIssue.category}</div>
            <div className="issue-priority" style={{ background: getPriorityColor(existingIssue.priority) }}>
              {existingIssue.priority} Priority
            </div>
          </div>
          
          <div className="issue-title">{existingIssue.title}</div>
          
          <div className="issue-stats">
            <div className="stat">
              <TrendingUp size={14} />
              <span>{existingIssue.complaintCount} reports</span>
            </div>
            <div className="stat">
              <ThumbsUp size={14} />
              <span>{existingIssue.upvotes} upvotes</span>
            </div>
            <div className="stat">
              <MapPin size={14} />
              <span>Ward {existingIssue.ward}</span>
            </div>
          </div>
          
          <div className="issue-status">
            <div className={`status-badge ${existingIssue.status?.toLowerCase().replace(' ', '-')}`}>
              {existingIssue.status || 'Open'}
            </div>
          </div>
        </div>

        {/* Impact Message */}
        <div className="impact-message">
          <CheckCircle size={16} />
          <span>Upvoting this issue helps prioritize it for faster resolution!</span>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button 
            className="upvote-btn"
            onClick={onUpvote}
            disabled={loading}
          >
            {loading ? (
              <div className="btn-loader"></div>
            ) : (
              <>
                <ThumbsUp size={16} />
                <span>Upvote Existing Issue</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
          
          <button 
            className="continue-btn"
            onClick={onContinue}
            disabled={loading}
          >
            <AlertTriangle size={16} />
            <span>Still Report as New</span>
          </button>
        </div>

        {/* Note */}
        <div className="modal-note">
          <span>💡 Upvoting helps the community identify urgent issues faster</span>
        </div>
      </motion.div>
    </div>
  );
};

export default DuplicateWarningModal;