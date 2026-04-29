import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ThumbsUp, ThumbsDown, Users, Award, CheckCircle, 
  Clock, TrendingUp, Shield, Star, Zap, 
  Eye, Heart, MessageCircle, Share2, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getSeed = (value = '') => {
  const text = String(value);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return hash;
};

const buildDummyVerification = (issue) => {
  const seed = getSeed(issue?._id || issue?.id || issue?.issueTitle || issue?.title || 'civictrack');
  const totalVotes = 18 + (seed % 67);
  const trustPercent = 52 + (seed % 41);
  const verifiedCount = Math.max(1, Math.round((totalVotes * trustPercent) / 100));
  const notFixedCount = Math.max(1, totalVotes - verifiedCount);
  return { verifiedCount, notFixedCount };
};

const getVerificationCounts = (issue) => {
  const verifiedCount = issue?.verifiedCount ?? issue?.votes?.fixed;
  const notFixedCount = issue?.notFixedCount ?? issue?.votes?.notFixed;

  if ((verifiedCount || 0) > 0 || (notFixedCount || 0) > 0) {
    return {
      verifiedCount: verifiedCount || 0,
      notFixedCount: notFixedCount || 0
    };
  }

  return buildDummyVerification(issue);
};

const VerificationStatus = ({ issue, issueData, onVote }) => {
  const { user } = useAuth();
  const sourceIssue = issue || issueData;
  const initialCounts = useMemo(() => getVerificationCounts(sourceIssue), [sourceIssue]);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [localVerifiedCount, setLocalVerifiedCount] = useState(initialCounts.verifiedCount);
  const [localNotFixedCount, setLocalNotFixedCount] = useState(initialCounts.notFixedCount);
  
  const totalVotes = localVerifiedCount + localNotFixedCount;
  const fixedPercentage = totalVotes > 0 ? (localVerifiedCount / totalVotes) * 100 : 0;
  const trustScore = fixedPercentage;

  const handleVote = (vote) => {
    if (hasVoted) return;
    if (!user) {
      alert('Login to verify civic issues');
      return;
    }
    setHasVoted(true);
    setUserVote(vote);
    if (vote === 'fixed') {
      setLocalVerifiedCount(prev => prev + 1);
    } else {
      setLocalNotFixedCount(prev => prev + 1);
    }
    if (onVote) onVote(vote);
  };

  return (
    <motion.div 
      className="verification-pro-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with Trust Badge */}
      <div className="verification-pro-header">
        <div className="header-left">
          <Shield size={18} className="shield-icon" />
          <span className="header-title">Community Trust Score</span>
        </div>
        <div className={`trust-badge ${trustScore >= 70 ? 'high' : trustScore >= 40 ? 'medium' : 'low'}`}>
          <Star size={14} />
          <span>{trustScore.toFixed(0)}% Trust</span>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="verification-pro-stats">
        <div className="stat-circle">
          <div className="circle-progress">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="url(#gradient)" strokeWidth="8" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * fixedPercentage / 100)}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="700">
                {fixedPercentage.toFixed(0)}%
              </text>
            </svg>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </div>
          <div className="stat-label">Resolution Rate</div>
        </div>

        <div className="stat-numbers">
          <div className="stat-number-item">
            <div className="stat-value">{localVerifiedCount}</div>
            <div className="stat-desc">
              <ThumbsUp size={12} /> Confirmed Resolved
            </div>
          </div>
          <div className="stat-number-item">
            <div className="stat-value">{localNotFixedCount}</div>
            <div className="stat-desc">
              <ThumbsDown size={12} /> Reported Unresolved
            </div>
          </div>
          <div className="stat-number-item">
            <div className="stat-value">{totalVotes}</div>
            <div className="stat-desc">
              <Users size={12} /> Community Votes
            </div>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {!hasVoted && (
        <div className="verification-pro-voting">
          <div className="voting-header">
            <Eye size={14} />
            <span>Help verify this issue</span>
          </div>
          <div className="voting-buttons">
            <motion.button 
              className="vote-btn fixed"
              onClick={() => handleVote('fixed')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle size={18} />
              <div>
                <strong>Resolved</strong>
                <span>Issue was fixed properly</span>
              </div>
            </motion.button>
            <motion.button 
              className="vote-btn not-fixed"
              onClick={() => handleVote('not_fixed')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <XCircle size={18} />
              <div>
                <strong>Unresolved</strong>
                <span>Still facing the issue</span>
              </div>
            </motion.button>
          </div>
        </div>
      )}

      {/* Thank You Message */}
      {hasVoted && (
        <motion.div 
          className="verification-pro-thanks"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <CheckCircle size={20} />
          <div>
            <strong>Verification Recorded</strong>
            <span>You voted: {userVote === 'fixed' ? 'Issue Resolved ✓' : 'Issue Unresolved ✗'}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VerificationStatus;
