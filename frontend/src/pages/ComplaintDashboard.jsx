import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import './ComplaintDashboard.css';

const ComplaintDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      // Load complaints from backend API
      const data = await apiService.fetchComplaints();
      const callData = await apiService.fetchCallComplaints();
      const allComplaints = [
        ...data,
        ...callData.map(complaint => ({ ...complaint, source: 'vapi-call', upvotes: 0 }))
      ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      setComplaints(allComplaints);
      
      // Calculate stats
      const total = allComplaints.length;
      const resolved = allComplaints.filter(c => c.status === 'resolved').length;
      const pending = allComplaints.filter(c => c.status === 'pending').length;
      const inProgress = allComplaints.filter(c => c.status === 'in-progress').length;
      
      setStats({ total, resolved, pending, inProgress });
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { label: 'Total Complaints', value: stats.total, icon: '📋', color: '#667eea' },
    { label: 'Resolved', value: stats.resolved, icon: '✅', color: '#10b981' },
    { label: 'In Progress', value: stats.inProgress, icon: '🔄', color: '#f59e0b' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: '#ef4444' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="status-badge status-pending">⏳ PENDING</span>;
      case 'in-progress': return <span className="status-badge status-in-progress">🔄 IN PROGRESS</span>;
      case 'resolved': return <span className="status-badge status-resolved">✅ RESOLVED</span>;
      default: return <span className="status-badge status-pending">⏳ PENDING</span>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 Citizen Dashboard</h1>
        <p className="dashboard-subtitle">Track your complaints and city statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsCards.map((stat, index) => (
          <motion.div
            key={index}
            className="stat-card-glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="stat-number">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Complaints */}
      <div className="recent-section">
        <div className="section-header">
          <h2 className="section-title">Recent Complaints</h2>
          <Link to="/report">
            <button className="new-complaint-btn">+ New Complaint</button>
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-state">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Complaints Yet</h3>
            <p>Be the first to report an issue in your area!</p>
            <Link to="/report">
              <button className="report-now-btn">Report Now</button>
            </Link>
          </div>
        ) : (
          <div className="complaints-list">
            {complaints.map((complaint, index) => (
              <motion.div
                key={complaint._id || index}
                className="complaint-card-glass"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="complaint-header">
                  <div className="complaint-info">
                    <h3 className="complaint-title">{complaint.title}</h3>
                    <div className="complaint-meta">
                      <span className="complaint-category">{complaint.category}</span>
                      <span className="complaint-location">📍 Ward {complaint.ward}</span>
                    </div>
                  </div>
                  {getStatusBadge(complaint.status)}
                </div>
                
                <p className="complaint-description">{complaint.description}</p>
                
                <div className="complaint-footer">
                  <div className="complaint-details">
                    <span>📅 {new Date(complaint.date).toLocaleDateString()}</span>
                    <span>📍 {complaint.location}</span>
                    <span>👍 {complaint.upvotes} upvotes</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDashboard;
