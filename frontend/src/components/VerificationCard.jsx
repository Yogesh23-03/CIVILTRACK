import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown, Clock, Award, Users, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './VerificationCard.css';

const VerificationCard = ({ issue, onVerificationUpdate }) => {
  const { user } = useAuth();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    loadVerificationStatus();
  }, [issue._id]);

  const loadVerificationStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/verification/${issue._id}/status`);
      setVerificationData(response.data);
    } catch (error) {
      console.error('Error loading verification:', error);
    }
  };

  const handleVote = async (vote) => {
    if (!user) {
      alert('Please login to verify civic issues');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/verification/${issue._id}/verify`, 
        { vote },
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      
      setVerificationData(prev => ({
        ...prev,
        verifiedCount: response.data.verifiedCount,
        notFixedCount: response.data.notFixedCount,
        fixedPercentage: response.data.fixedPercentage,
        verificationStatus: response.data.verificationStatus
      }));
      
      setHasVoted(true);
      setUserVote(vote);
      if (onVerificationUpdate) onVerificationUpdate();
      
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting vote');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch(verificationData?.verificationStatus) {
      case 'verified':
        return { icon: <CheckCircle size={16} />, text: 'Community Verified', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
      case 'rejected':
        return { icon: <XCircle size={16} />, text: 'Community Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
      default:
        return { icon: <Clock size={16} />, text: 'Awaiting Verification', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    }
  };

  if (!verificationData) return null;

  const status = getStatusBadge();

  return (
    <div className="verification-card glass">
      <div className="verification-header">
        <div className="verification-title">
          <Award size={20} />
          <h3>Community Verification</h3>
        </div>
        <div className="verification-badge" style={{ background: status.bg, color: status.color }}>
          {status.icon}
          <span>{status.text}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="verification-progress">
        <div className="progress-bar-container">
          <div className="progress-fixed" style={{ width: `${verificationData.fixedPercentage || 0}%` }}>
            <span className="progress-label">Fixed {verificationData.fixedPercentage?.toFixed(0) || 0}%</span>
          </div>
          <div className="progress-not-fixed" style={{ width: `${verificationData.notFixedPercentage || 0}%` }}>
            <span className="progress-label">Not Fixed {verificationData.notFixedPercentage?.toFixed(0) || 0}%</span>
          </div>
        </div>
      </div>

      {/* Vote Counts */}
      <div className="verification-stats">
        <div className="stat-item fixed">
          <ThumbsUp size={16} />
          <span className="stat-count">{verificationData.verifiedCount || 0}</span>
          <span className="stat-label">Say Fixed</span>
        </div>
        <div className="stat-item not-fixed">
          <ThumbsDown size={16} />
          <span className="stat-count">{verificationData.notFixedCount || 0}</span>
          <span className="stat-label">Say Not Fixed</span>
        </div>
        <div className="stat-item total">
          <Users size={16} />
          <span className="stat-count">{verificationData.totalVotes || 0}</span>
          <span className="stat-label">Total Votes</span>
        </div>
      </div>

      {/* Community Trust Score */}
      <div className="trust-score">
        <Eye size={14} />
        <span>Community Trust Score</span>
        <div className="trust-bar">
          <div className="trust-fill" style={{ width: `${verificationData.communityTrustScore || 0}%` }}></div>
        </div>
        <span className="trust-value">{verificationData.communityTrustScore?.toFixed(0) || 0}%</span>
      </div>

      {/* Voting Buttons - Only if pending and user eligible */}
      {issue.status === 'Pending Verification' && !hasVoted && user && (
        <div className="verification-buttons">
          <button 
            className="vote-btn fixed-btn"
            onClick={() => handleVote('fixed')}
            disabled={loading}
          >
            <ThumbsUp size={16} />
            <span>Yes, Issue Fixed</span>
          </button>
          <button 
            className="vote-btn not-fixed-btn"
            onClick={() => handleVote('not_fixed')}
            disabled={loading}
          >
            <ThumbsDown size={16} />
            <span>No, Still Not Fixed</span>
          </button>
        </div>
      )}

      {hasVoted && (
        <div className="vote-confirmation">
          <CheckCircle size={14} />
          <span>Thank you for verifying! Your vote helps build trust.</span>
        </div>
      )}

      {!user && verificationData.verificationStatus === 'pending' && (
        <div className="login-prompt">
          <span>🔐 Login to verify this issue</span>
        </div>
      )}
    </div>
  );
};

export default VerificationCard;