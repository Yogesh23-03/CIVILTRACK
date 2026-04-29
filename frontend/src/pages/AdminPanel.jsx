import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Users, FileText, CheckCircle, Clock, AlertTriangle,
  TrendingUp, MapPin, Building, Trash2, Droplet, Zap,
  Eye, Target, BarChart3, ArrowRight, RefreshCw, 
  Filter, Search, Calendar, ThumbsUp, Activity, Flame, X,
  UserCheck, Award
} from 'lucide-react';
import './AdminPanel.css';
import VerificationStatus from '../components/VerificationStatus';
import * as apiService from '../services/apiService';
const AdminPanel = () => {
  const [issues, setIssues] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('issues');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await apiService.fetchAdminDashboard();
      setIssues(data.issues || []);
      setComplaints(data.complaints || []);
      setUsers(data.users || []);
      setMetrics(data.metrics || null);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(error.response?.data?.message || 'Only admins can load this dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setSelectedUser('all');
  };

  const handleResolveIssue = async (issueId) => {
    try {
      await apiService.updateIssueStatus(issueId, 'Resolved');
      setShowResolveModal(false);
      setSelectedIssue(null);
      loadAllData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resolve issue');
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      try {
        await apiService.deleteAdminComplaint(complaintId);
        loadAllData();
        alert('Complaint deleted successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete complaint');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? All their complaints will also be deleted.')) {
      try {
        await apiService.deleteAdminUser(userId);
        loadAllData();
        alert('User and their complaints deleted successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleResolveComplaint = async (complaint) => {
    try {
      if (complaint.isCallComplaint) {
        await apiService.updateCallComplaintStatus(complaint.id, 'resolved');
      } else {
        await apiService.updateComplaintStatus(complaint.id, 'resolved');
      }
      loadAllData();
      alert('Complaint marked resolved');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resolve complaint');
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#ef4444';
      case 'In Progress': return '#f59e0b';
      case 'Resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Roads': return <Building size={18} />;
      case 'Sanitation': return <Trash2 size={18} />;
      case 'Water': return <Droplet size={18} />;
      case 'Electricity': return <Zap size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filterPriority !== 'all' && issue.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (searchTerm && !issue.issueTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredComplaints = complaints.filter(complaint => {
    if (filterCategory !== 'all' && complaint.category !== filterCategory) return false;
    if (selectedUser !== 'all') {
      const user = users.find(u => String(u.id) === String(selectedUser));
      if (user && complaint.userEmail !== user.email && String(complaint.userId) !== String(selectedUser)) return false;
    }
    if (searchTerm && !(complaint.title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const statsCards = [
    { label: 'Total Issues', value: metrics?.summary?.totalIssues || 0, icon: <Target size={20} />, color: '#4f46e5' },
    { label: 'Resolved', value: metrics?.summary?.resolvedIssues || 0, icon: <CheckCircle size={20} />, color: '#10b981' },
    { label: 'High Priority', value: metrics?.summary?.highPriorityIssues || 0, icon: <Flame size={20} />, color: '#ef4444' },
    { label: 'Total Complaints', value: metrics?.summary?.totalComplaints || 0, icon: <FileText size={20} />, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-bg">
          <div className="gradient-orb"></div>
          <div className="gradient-orb2"></div>
          <div className="grid-overlay"></div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb2"></div>
        <div className="gradient-orb3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="admin-container">
        {/* Header */}
        <motion.div 
          className="admin-header glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-content">
            <div className="header-left">
              <Shield size={28} className="header-icon" />
              <div>
                <h1>Administrator Dashboard</h1>
                <p>Manage issues • Track impact • Intelligent oversight</p>
              </div>
            </div>
            <button className="refresh-btn" onClick={loadAllData}>
              <RefreshCw size={16} />
              <span>Refresh Data</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {statsCards.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              
            </motion.div>
            
          ))}
        </div>

        {/* Impact Overview */}
        {metrics && (
          <motion.div 
            className="impact-overview glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="impact-header">
              <Target size={20} />
              <h3>Impact Overview</h3>
            </div>
            <div className="impact-grid">
              <div className="impact-item">
                <span className="impact-label">Resolution Rate</span>
                <span className="impact-value">{metrics.summary.resolutionRate}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${metrics.summary.resolutionRate}%` }}></div>
                </div>
              </div>
              <div className="impact-item">
                <span className="impact-label">Total Issues</span>
                <span className="impact-value">{metrics.summary.totalIssues}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(metrics.summary.resolvedIssues / metrics.summary.totalIssues) * 100}%`, background: '#10b981' }}></div>
                </div>
              </div>
              <div className="impact-item">
                <span className="impact-label">Active Issues</span>
                <span className="impact-value">{metrics.summary.totalIssues - metrics.summary.resolvedIssues}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${((metrics.summary.totalIssues - metrics.summary.resolvedIssues) / metrics.summary.totalIssues) * 100}%`, background: '#f59e0b' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="admin-tabs glass">
          <button 
            className={`tab ${activeTab === 'issues' ? 'active' : ''}`}
            onClick={() => switchTab('issues')}
          >
            <Target size={16} />
            <span>Intelligent Issues ({issues.length})</span>
          </button>
          <button 
            className={`tab ${activeTab === 'user-complaints' ? 'active' : ''}`}
            onClick={() => switchTab('user-complaints')}
          >
            <FileText size={16} />
            <span>User Complaints ({complaints.length})</span>
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => switchTab('users')}
          >
            <Users size={16} />
            <span>Citizens ({users.length})</span>
          </button>
          <button 
            className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => switchTab('metrics')}
          >
            <BarChart3 size={16} />
            <span>Impact Metrics</span>
          </button>
        </div>

       {/* Issues List */}
{activeTab === 'issues' && (
  <div className="issues-list">
    {/* Filters */}
    <div className="filters-bar glass">
      <div className="search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search issues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <select 
        className="filter-select"
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value)}
      >
        <option value="all">All Priorities</option>
        <option value="High">🔥 High Priority</option>
        <option value="Medium">⚠️ Medium Priority</option>
        <option value="Low">✅ Low Priority</option>
      </select>
      <select 
        className="filter-select"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
      </select>
      <select 
        className="filter-select"
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="Roads">🛣️ Roads</option>
        <option value="Sanitation">🗑️ Sanitation</option>
        <option value="Water">💧 Water</option>
        <option value="Electricity">⚡ Electricity</option>
      </select>
    </div>

    {filteredIssues.length === 0 ? (
      <div className="empty-state glass">
        <div className="empty-icon">📭</div>
        <h3>No issues found</h3>
        <p>Try adjusting your filters</p>
      </div>
    ) : (
      filteredIssues.map((issue, index) => (
        <motion.div
          key={issue.id}
          className="issue-admin-card glass"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -2 }}
        >
          <div className="issue-left">
            <div className="issue-priority-badge" style={{ 
              background: `${getPriorityColor(issue.priority)}20`,
              color: getPriorityColor(issue.priority)
            }}>
              {getPriorityIcon(issue.priority)}
              <span>{issue.priority}</span>
            </div>
            <div className="issue-category-icon">
              {getCategoryIcon(issue.category)}
            </div>
          </div>
          
          <div className="issue-middle">
            <h3 className="issue-title">{issue.issueTitle}</h3>
            <div className="issue-meta">
              <span className="meta-item">
                <MapPin size={12} />
                Ward {issue.ward}
              </span>
              <span className="meta-item">
                {getCategoryIcon(issue.category)}
                {issue.category}
              </span>
              <span className="meta-item">
                <Building size={12} />
                {issue.assignedDepartment}
              </span>
            </div>
            <div className="issue-stats">
              <div className="stat-bubble">
                <FileText size={12} />
                <span>{issue.complaintCount} complaints</span>
              </div>
              <div className="stat-bubble">
                <Users size={12} />
                <span>{issue.complaintCount} citizens affected</span>
              </div>
            </div>
          </div>
          
          <div className="issue-right">
            <div className="issue-status" style={{ color: getStatusColor(issue.status) }}>
              <div className="status-dot" style={{ background: getStatusColor(issue.status) }}></div>
              <span>{issue.status || 'Open'}</span>
            </div>
            
            {/* ✅ VERIFICATION STATUS - Properly placed INSIDE the map */}
            <VerificationStatus issueData={issue} />
            
            {issue.status !== 'Resolved' ? (
              <button 
                className="resolve-btn"
                onClick={() => {
                  setSelectedIssue(issue);
                  setShowResolveModal(true);
                }}
              >
                <CheckCircle size={14} />
                <span>Mark Resolved</span>
              </button>
            ) : (
              <div className="resolved-badge">
                <CheckCircle size={14} />
                <span>Resolved</span>
              </div>
            )}
          </div>
        </motion.div>
      ))
    )}
  </div>
)}

        {/* User Complaints Tab */}
        {activeTab === 'user-complaints' && (
          <div className="user-complaints-tab">
            <div className="filters-bar glass">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Roads">🛣️ Roads</option>
                <option value="Sanitation">🗑️ Sanitation</option>
                <option value="Water">💧 Water</option>
                <option value="Electricity">⚡ Electricity</option>
              </select>
              <select 
                className="filter-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="all">All Users</option>
                {users.filter(u => u.role === 'citizen').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="empty-state glass">
                <div className="empty-icon">📭</div>
                <h3>{complaints.length === 0 ? 'No complaints in database' : 'No complaints match filters'}</h3>
                <p>{complaints.length === 0 ? 'Imported or reported complaints will appear here.' : 'Try resetting search, category, or user filters.'}</p>
                {complaints.length > 0 && (
                  <button
                    className="refresh-btn"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                      setSelectedUser('all');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="complaints-grid">
                {filteredComplaints.map((complaint) => (
                  <motion.div
                    key={complaint.id}
                    className="complaint-admin-card glass"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="complaint-header">
                      <div className="complaint-category">
                        {getCategoryIcon(complaint.category)}
                        <span>{complaint.category}</span>
                      </div>
                      <div className="complaint-ward">
                        <MapPin size={12} />
                        Ward {complaint.ward}
                      </div>
                      <div className="complaint-status" style={{ color: getStatusColor(complaint.status === 'resolved' ? 'Resolved' : 'Open') }}>
                        {complaint.status}
                      </div>
                    </div>
                    <h4 className="complaint-title">{complaint.title}</h4>
                    <p className="complaint-desc">{complaint.description?.substring(0, 120)}...</p>
                    <div className="complaint-meta">
                      <span className="complaint-author">
                        <Users size={12} />
                        {complaint.userName || 'Anonymous'}
                      </span>
                      <span className="complaint-upvotes">
                        <ThumbsUp size={12} />
                        {complaint.upvotes || 0} upvotes
                      </span>
                      <span className="complaint-date">
                        <Calendar size={12} />
                        {new Date(complaint.date).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className="delete-complaint-btn"
                      onClick={() => handleDeleteComplaint(complaint.id)}
                    >
                      <Trash2 size={14} />
                      Delete Complaint
                    </button>
                    {complaint.status !== 'resolved' && (
                      <button
                        className="resolve-btn"
                        onClick={() => handleResolveComplaint(complaint)}
                      >
                        <CheckCircle size={14} />
                        Mark Resolved
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-list">
            {users.map((user) => (
              <motion.div
                key={user.id}
                className="user-card glass"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -2 }}
              >
                <div className="user-avatar">
                  {user.name.charAt(0)}
                </div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <div className="user-meta">
                    <span className={`user-role ${user.role}`}>{user.role}</span>
                    <span className="user-points">
                      <Award size={12} />
                      {user.points || 0} points
                    </span>
                  </div>
                </div>
                {user.role !== 'admin' && (
                  <button 
                    className="delete-user-btn"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 size={14} />
                    Delete User
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && metrics && (
          <div className="metrics-tab">
            <div className="metrics-grid-category">
              <h3>Category-wise Impact</h3>
              <div className="category-metrics">
                {Object.entries(metrics.categoryImpact).map(([category, data]) => (
                  <div key={category} className="category-metric-card glass">
                    <div className="category-header">
                      {getCategoryIcon(category)}
                      <span className="category-name">{category}</span>
                      <span className="category-improvement">{data.improvement.toFixed(0)}%</span>
                    </div>
                    <div className="category-stats">
                      <div className="category-stat">
                        <span>Issues</span>
                        <strong>{data.totalIssues}</strong>
                      </div>
                      <div className="category-stat">
                        <span>Complaints</span>
                        <strong>{data.totalComplaints}</strong>
                      </div>
                      <div className="category-stat">
                        <span>Resolved</span>
                        <strong className="positive">{data.resolved}</strong>
                      </div>
                    </div>
                    <div className="category-bar">
                      <div className="category-fill" style={{ width: `${data.improvement}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedIssue && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowResolveModal(false)}>
              <X size={20} />
            </button>
            <h3>Resolve Issue</h3>
            <p>Are you sure you want to mark this issue as resolved?</p>
            <div className="issue-details-modal">
              <p><strong>Issue:</strong> {selectedIssue.issueTitle}</p>
              <p><strong>Affected Citizens:</strong> {selectedIssue.complaintCount}</p>
              <p><strong>Department:</strong> {selectedIssue.assignedDepartment}</p>
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowResolveModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={() => handleResolveIssue(selectedIssue.id)}>
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
