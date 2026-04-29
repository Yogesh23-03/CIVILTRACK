import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as apiService from '../services/apiService';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, MapPin, Users, Activity, BarChart3,
  Flame, Shield, Building, Droplet, Zap, Trash2,
  ArrowRight, Eye, Target, Award
} from 'lucide-react';

import './IssueDashboard.css';

const IssueDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [impactMetrics, setImpactMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch issues from backend
      const issuesData = await apiService.fetchIssues();
      setIssues(issuesData);
      
      // Calculate impact metrics
      if (issuesData && issuesData.length > 0) {
        const resolvedIssues = issuesData.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
        const totalComplaints = issuesData.reduce((sum, i) => sum + (i.complaintCount || 0), 0);
        const totalReduction = issuesData.reduce((sum, i) => sum + (i.impactMetrics?.reduction || 0), 0);
        const avgImprovement = issuesData.length > 0
          ? issuesData.reduce((sum, i) => sum + (i.impactMetrics?.improvementPercentage || 0), 0) / issuesData.length
          : 0;
        const categoryImpact = issuesData.reduce((acc, issue) => {
          const category = issue.category || 'Other';
          const current = acc[category] || { totalIssues: 0, totalComplaints: 0, reduction: 0, improvement: 0 };
          current.totalIssues += 1;
          current.totalComplaints += issue.complaintCount || 0;
          current.reduction += issue.impactMetrics?.reduction || 0;
          current.improvement = current.totalIssues > 0 ? current.reduction / current.totalIssues : 0;
          acc[category] = current;
          return acc;
        }, {});

        const metrics = {
          summary: {
            totalIssues: issuesData.length,
            resolvedIssues,
            resolutionRate: issuesData.length > 0 ? ((resolvedIssues / issuesData.length) * 100).toFixed(1) : 0,
            highPriorityIssues: issuesData.filter(i => i.priority === 'High').length,
            totalComplaints,
            totalReduction,
            avgImprovement: avgImprovement.toFixed(1)
          },
          categoryImpact
        };
        setImpactMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'High': return <Flame size={16} />;
      case 'Medium': return <AlertTriangle size={16} />;
      case 'Low': return <Clock size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Roads': return <Building size={20} />;
      case 'Sanitation': return <Trash2 size={20} />;
      case 'Water': return <Droplet size={20} />;
      case 'Electricity': return <Zap size={20} />;
      default: return <Activity size={20} />;
    }
  };

  const filteredIssues = selectedCategory === 'all' 
    ? issues 
    : issues.filter(i => i.category === selectedCategory);

  if (loading) {
    return (
      <div className="issue-page">
        <div className="issue-bg">
          <div className="gradient-orb"></div>
          <div className="gradient-orb2"></div>
          <div className="grid-overlay"></div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading intelligent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-page">
      <div className="issue-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb2"></div>
        <div className="gradient-orb3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="issue-container">
        {/* Header */}
        <motion.div 
          className="issue-header glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-content">
            <div className="header-left">
              <Target size={28} className="header-icon" />
              <div>
                <h1>Intelligent Issue Tracker</h1>
                <p>AI-powered aggregation • Priority mapping • Impact tracking</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Impact Metrics Cards */}
        {impactMetrics && (
          <div className="metrics-grid">
            <motion.div className="metric-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="metric-icon"><Activity size={24} /></div>
              <div className="metric-value">{impactMetrics.summary.totalIssues}</div>
              <div className="metric-label">Active Issues</div>
              <div className="metric-trend">+{impactMetrics.summary.totalComplaints} complaints</div>
            </motion.div>
            
            <motion.div className="metric-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="metric-icon"><CheckCircle size={24} style={{ color: '#10b981' }} /></div>
              <div className="metric-value">{impactMetrics.summary.resolvedIssues}</div>
              <div className="metric-label">Resolved Issues</div>
              <div className="metric-trend">{impactMetrics.summary.resolutionRate}% resolution rate</div>
            </motion.div>
            
            <motion.div className="metric-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="metric-icon"><TrendingUp size={24} style={{ color: '#f59e0b' }} /></div>
              <div className="metric-value">{impactMetrics.summary.totalReduction}</div>
              <div className="metric-label">Complaints Reduced</div>
              <div className="metric-trend">{impactMetrics.summary.avgImprovement}% improvement</div>
            </motion.div>
            
            <motion.div className="metric-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="metric-icon"><Flame size={24} style={{ color: '#ef4444' }} /></div>
              <div className="metric-value">{impactMetrics.summary.highPriorityIssues}</div>
              <div className="metric-label">High Priority</div>
              <div className="metric-trend">Needs immediate action</div>
            </motion.div>
          </div>
        )}

        {/* Category Filters */}
        <div className="category-filters-bar glass">
          <button 
            className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Issues
          </button>
          <button 
            className={`filter-pill ${selectedCategory === 'Roads' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Roads')}
          >
            <Building size={14} /> Roads
          </button>
          <button 
            className={`filter-pill ${selectedCategory === 'Sanitation' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Sanitation')}
          >
            <Trash2 size={14} /> Sanitation
          </button>
          <button 
            className={`filter-pill ${selectedCategory === 'Water' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Water')}
          >
            <Droplet size={14} /> Water
          </button>
          <button 
            className={`filter-pill ${selectedCategory === 'Electricity' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Electricity')}
          >
            <Zap size={14} /> Electricity
          </button>
        </div>

        {/* Issues List */}
        <div className="issues-list">
          {filteredIssues.map((issue, index) => (
            <motion.div
              key={issue._id}
              className="issue-card glass"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="issue-priority" style={{ 
                background: `${getPriorityColor(issue.priority)}20`,
                borderLeftColor: getPriorityColor(issue.priority)
              }}>
                {getPriorityIcon(issue.priority)}
                <span>{issue.priority} Priority</span>
              </div>
              
              <div className="issue-content">
                <div className="issue-header-row">
                  <div className="issue-category">
                    {getCategoryIcon(issue.category)}
                    <span>{issue.category}</span>
                  </div>
                  <div className="issue-ward">
                    <MapPin size={14} />
                    <span>Ward {issue.ward}</span>
                  </div>
                </div>
                
                <h3 className="issue-title">{issue.issueTitle}</h3>
                <p className="issue-description">
                  {issue.complaintIds.length} complaints linked • {issue.complaintCount} total reports
                </p>
                
                <div className="issue-stats">
                  <div className="stat">
                    <span className="stat-label">Complaints</span>
                    <span className="stat-value">{issue.complaintCount}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Department</span>
                    <span className="stat-value">{issue.assignedDepartment}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Impact</span>
                    <span className="stat-value positive">
                      {issue.impactMetrics?.improvementPercentage?.toFixed(0) || 0}% improved
                    </span>
                  </div>
                </div>
                
                <div className="issue-footer">
                  <div className="issue-status" style={{ color: getPriorityColor(issue.status === 'Resolved' ? 'Low' : issue.priority) }}>
                    {issue.status === 'Resolved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    <span>{issue.status || 'Open'}</span>
                  </div>
                  <button className="view-details-btn">
                    View Details <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category Impact Section */}
        {impactMetrics && (
          <div className="category-impact glass">
            <h3>Impact by Category</h3>
            <div className="impact-grid">
              {Object.entries(impactMetrics.categoryImpact).map(([category, data]) => (
                <div key={category} className="impact-item">
                  <div className="impact-header">
                    <span className="impact-category">{category}</span>
                    <span className="impact-percent">{data.improvement.toFixed(0)}%</span>
                  </div>
                  <div className="impact-bar">
                    <div className="impact-fill" style={{ width: `${data.improvement}%` }}></div>
                  </div>
                  <div className="impact-stats">
                    <span>{data.totalIssues} issues</span>
                    <span>{data.totalComplaints} complaints</span>
                    <span>{data.reduction} reduced</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDashboard;
