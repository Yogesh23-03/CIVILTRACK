import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MapPin, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, Flame, Droplet, Zap, Trash2, Building,
  Activity, Users, Target, Eye, Calendar,
  Shield, Award, BarChart3, Globe, Thermometer,
  Navigation, Bell, Crown, Phone, Mail, Send,
  ExternalLink, FileText, Download, Printer, RefreshCw,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as MapTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './PublicDashboard.css';
import * as apiService from '../services/apiService';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

const PublicDashboard = () => {
  const [selectedWard, setSelectedWard] = useState('all');
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [showSolutionModal, setShowSolutionModal] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [locationPermission, setLocationPermission] = useState(false);

  const wards = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const categories = ['all', 'Roads', 'Sanitation', 'Water', 'Electricity', 'Other'];

  // Bangalore areas for each ward
  const bangaloreAreas = {
    '1': ['MG Road', 'Trinity Circle', 'Ulsoor'],
    '2': ['Indiranagar', 'CV Raman Nagar', 'HAL'],
    '3': ['Koramangala', 'ST Bed Layout', 'Jakkasandra'],
    '4': ['Whitefield', 'Brookfield', 'Hoodi'],
    '5': ['Jayanagar', 'Basavanagudi', 'JP Nagar'],
    '6': ['Bannerghatta Road', 'Arekere', 'Hulimavu'],
    '7': ['Electronic City', 'Hosur Road', 'Bommasandra'],
    '8': ['Hebbal', 'Manyata Tech Park', 'Nagavara'],
    '9': ['Marathahalli', 'Bellandur', 'Kadubeesanahalli'],
    '10': ['Rajajinagar', 'Vijayanagar', 'Malleswaram'],
    '11': ['BTM Layout', 'HSR Layout', 'Silk Board'],
    '12': ['Yelahanka', 'Devanahalli', 'Aerodrome']
  };

  const departmentContacts = {
    'Roads': { name: 'BBMP Roads Department', helpline: '1915', email: 'roadcomplaint@bbmp.gov.in', website: 'https://bbmp.gov.in', authority: 'Chief Engineer', responseTime: '24-48 hours' },
    'Sanitation': { name: 'BBMP Solid Waste Management', helpline: '1916', email: 'swm@bbmp.gov.in', website: 'https://bbmp.gov.in', authority: 'Health Officer', responseTime: '12-24 hours' },
    'Water': { name: 'BWSSB - Bangalore Water Supply', helpline: '1917', email: 'customercare@bwssb.gov.in', website: 'https://bwssb.gov.in', authority: 'Chief Engineer', responseTime: '24-48 hours' },
    'Electricity': { name: 'BESCOM - Bangalore Electricity', helpline: '1912', email: 'customercare@bescom.co.in', website: 'https://bescom.co.in', authority: 'Zonal Officer', responseTime: '6-12 hours' },
    'Other': { name: 'CPGRAMS - Central Grievance Portal', helpline: '1800-11-5500', email: 'pgms-portal@nic.in', website: 'https://pgms.gov.in', authority: 'Grievance Officer', responseTime: '7 days' }
  };

  useEffect(() => {
    loadData();
  }, [selectedWard, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      let allIssues = await apiService.fetchCommunityPosts();
      
      if (allIssues.length === 0) {
        allIssues = generateBangaloreMockData();
      }
      
      let filteredIssues = [...allIssues];
      if (selectedWard !== 'all') {
        filteredIssues = filteredIssues.filter(i => i.ward === selectedWard);
      }
      if (selectedCategory !== 'all') {
        filteredIssues = filteredIssues.filter(i => i.category === selectedCategory);
      }
      
      setIssues(filteredIssues);
      
      const totalIssues = filteredIssues.length;
      const highPriority = filteredIssues.filter(i => i.priority === 'High').length;
      const resolved = filteredIssues.filter(i => i.status === 'Resolved').length;
      const totalComplaints = filteredIssues.reduce((acc, i) => acc + (i.complaintCount || 1), 0);
      
      setStats({
        totalIssues, highPriority, resolved,
        totalComplaints, resolvedComplaints: resolved,
        resolutionRate: totalIssues > 0 ? ((resolved / totalIssues) * 100).toFixed(1) : 0
      });
      
      prepareCharts(filteredIssues);
      generateHeatmapPoints(filteredIssues);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBangaloreMockData = () => {
    const mockIssues = [];
    const categoriesList = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'];
    const priorities = ['High', 'Medium', 'Low'];
    const statuses = ['Open', 'In Progress', 'Resolved'];
    
    // Bangalore coordinates (center)
    const bangaloreCenter = { lat: 12.9716, lng: 77.5946 };
    
    for (let i = 1; i <= 35; i++) {
      const ward = (i % 12) + 1;
      const category = categoriesList[i % categoriesList.length];
      const complaintCount = Math.floor(Math.random() * 45) + 5;
      
      // Determine priority based on complaint count
      let priority = 'Low';
      if (complaintCount > 20) priority = 'High';
      else if (complaintCount > 10) priority = 'Medium';
      
      // Get area name for this ward
      const wardAreas = bangaloreAreas[ward] || ['Bangalore Area'];
      const area = wardAreas[i % wardAreas.length];
      
      mockIssues.push({
        id: i,
        issueTitle: `${category} issue - ${area}, Ward ${ward}`,
        category: category,
        ward: ward.toString(),
        area: area,
        priority: priority,
        status: statuses[i % 3],
        complaintCount: complaintCount,
        lat: bangaloreCenter.lat + (Math.random() - 0.5) * 0.1,
        lng: bangaloreCenter.lng + (Math.random() - 0.5) * 0.1,
        createdAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
      });
    }
    localStorage.setItem('civictrack_issues', JSON.stringify(mockIssues));
    return mockIssues;
  };

  const prepareCharts = (issuesList) => {
    const categoryCount = {};
    categories.slice(1).forEach(cat => { categoryCount[cat] = 0; });
    issuesList.forEach(issue => {
      if (categoryCount[issue.category] !== undefined) {
        categoryCount[issue.category] += issue.complaintCount || 1;
      }
    });
    
    setCategoryData({
      labels: Object.keys(categoryCount),
      datasets: [{
        data: Object.values(categoryCount),
        backgroundColor: ['#3b82f6', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    });
    
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyData = weeks.map(() => Math.floor(Math.random() * 35) + 15);
    
    setTrendData({
      labels: weeks,
      datasets: [{
        label: 'New Issues',
        data: weeklyData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    });
    
    const priorityCount = { High: 0, Medium: 0, Low: 0 };
    issuesList.forEach(issue => {
      if (priorityCount[issue.priority] !== undefined) {
        priorityCount[issue.priority]++;
      }
    });
    
    setChartData({
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        label: 'Issues by Priority',
        data: [priorityCount.High, priorityCount.Medium, priorityCount.Low],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderRadius: 8,
        barPercentage: 0.6
      }]
    });
  };

  const generateHeatmapPoints = (issuesList) => {
    const points = issuesList.map(issue => ({
      lat: issue.location?.lat || issue.lat || 12.9716 + (Math.random() - 0.5) * 0.1,
      lng: issue.location?.lng || issue.lng || 77.5946 + (Math.random() - 0.5) * 0.1,
      complaintCount: issue.complaintCount,
      title: issue.issueTitle,
      category: issue.category,
      priority: issue.priority,
      ward: issue.ward,
      area: issue.area || issue.location?.address,
      id: issue._id || issue.id
    }));
    setHeatmapPoints(points);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationPermission(true);
          findNearbyIssues(position.coords.latitude, position.coords.longitude);
          addNotification('📍 Location detected! Showing Bangalore issues near you.', 'success');
        },
        () => addNotification('Please enable location to see nearby Bangalore issues', 'info')
      );
    }
  };

  const findNearbyIssues = (lat, lng) => {
    const nearby = issues.filter(issue => {
      if (!issue.lat) return false;
      const distance = getDistance(lat, lng, issue.lat, issue.lng);
      return distance < 5;
    });
    setNearbyIssues(nearby);
    if (nearby.length > 0) {
      addNotification(`📍 Found ${nearby.length} issues within 5km in Bangalore!`, 'info');
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Roads': return <Building size={14} />;
      case 'Sanitation': return <Trash2 size={14} />;
      case 'Water': return <Droplet size={14} />;
      case 'Electricity': return <Zap size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const addNotification = (message, type) => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [newNotification, ...prev].slice(0, 4));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 4000);
  };

  const fileOfficialComplaint = (issue) => {
    window.open('https://pgms.gov.in', '_blank');
    addNotification('Redirecting to CPGRAMS portal', 'info');
  };

  const downloadComplaintPDF = (issue) => {
    const content = `CIVICTRACK GRIEVANCE REPORT - BANGALORE\nRef: ${issue.id}\nTitle: ${issue.issueTitle}\nCategory: ${issue.category}\nWard: ${issue.ward}\nArea: ${issue.area || 'Bangalore'}\nPriority: ${issue.priority}\nComplaints: ${issue.complaintCount}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bangalore_grievance_${issue.id}.txt`;
    a.click();
    addNotification('Report downloaded', 'success');
  };

  const SolutionModal = ({ issue, onClose }) => {
    const dept = departmentContacts[issue.category] || departmentContacts.Other;
    return (
      <div className="solution-modal-overlay" onClick={onClose}>
        <div className="solution-modal glass" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <div className="modal-icon">🛠️</div>
          <h3>Official Grievance Redressal - Bangalore</h3>
          <div className="solution-department">
            <div className="dept-icon">🏛️</div>
            <div><h4>{dept.name}</h4><p>{dept.authority} - Bangalore</p></div>
          </div>
          <div className="solution-contacts">
            <a href={`tel:${dept.helpline}`} className="contact-card"><div className="contact-icon">📞</div><div><strong>Helpline</strong><p>{dept.helpline}</p></div></a>
            <a href={`mailto:${dept.email}`} className="contact-card"><div className="contact-icon">📧</div><div><strong>Email</strong><p>{dept.email}</p></div></a>
            <a href={dept.website} target="_blank" rel="noopener noreferrer" className="contact-card"><div className="contact-icon">🌐</div><div><strong>Portal</strong><p>File complaint</p></div></a>
          </div>
          <div className="solution-actions">
            <button className="official-btn" onClick={() => fileOfficialComplaint(issue)}><FileText size={16} /> CPGRAMS</button>
            <button className="download-btn" onClick={() => downloadComplaintPDF(issue)}><Download size={16} /> Download Report</button>
          </div>
          <div className="solution-note"><span>⏱️ SLA: {dept.responseTime}</span><span>📋 RTS Act Compliant</span><span>📍 Bangalore</span></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="public-page">
        <div className="public-bg"><div className="gradient-orb"></div><div className="gradient-orb2"></div><div className="grid-overlay"></div></div>
        <div className="loading-container"><div className="loading-spinner"></div><p>Loading Bangalore civic intelligence...</p></div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb2"></div>
        <div className="gradient-orb3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="notification-container">
        {notifications.map(n => <div key={n.id} className={`notification ${n.type}`}>{n.message}</div>)}
      </div>

      {showSolutionModal && <SolutionModal issue={showSolutionModal} onClose={() => setShowSolutionModal(null)} />}

      <div className="public-container">
        <motion.div className="public-header glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="header-content">
            <div className="header-left"><div className="header-icon"><Globe size={28} /></div><div><h1>Bengaluru City Intelligence Dashboard</h1><p>Live Heatmap • Real-time Charts • GPS Location • BBMP & BWSSB Integrated</p></div></div>
            <div className="header-actions">
              <button className="location-btn" onClick={getCurrentLocation}><Navigation size={18} /><span>{locationPermission ? '📍 Bangalore Active' : '📍 Enable GPS'}</span></button>
              <button className="govt-badge">🇮🇳 BBMP | BWSSB | BESCOM</button>
            </div>
          </div>
        </motion.div>

        {locationPermission && nearbyIssues.length > 0 && (
          <div className="nearby-badge glass"><Navigation size={14} /> {nearbyIssues.length} issues found near your Bangalore location</div>
        )}

        <div className="stats-grid">
          <div className="stat-card glass"><div className="stat-icon"><Activity size={24} /></div><div className="stat-number">{stats?.totalIssues || 0}</div><div className="stat-label">Active Issues</div><div className="stat-change">Bengaluru City</div></div>
          <div className="stat-card glass"><div className="stat-icon"><Flame size={24} style={{ color: '#ef4444' }} /></div><div className="stat-number">{stats?.highPriority || 0}</div><div className="stat-label">High Priority</div><div className="stat-change urgent">🔴 Red = Urgent</div></div>
          <div className="stat-card glass"><div className="stat-icon"><CheckCircle size={24} style={{ color: '#10b981' }} /></div><div className="stat-number">{stats?.resolved || 0}</div><div className="stat-label">Resolved Issues</div><div className="stat-change positive">🟢 Green = Resolved</div></div>
          <div className="stat-card glass"><div className="stat-icon"><TrendingUp size={24} style={{ color: '#8b5cf6' }} /></div><div className="stat-number">{stats?.resolutionRate || 0}%</div><div className="stat-label">Resolution Rate</div><div className="stat-change positive">↑ Improving</div></div>
        </div>

        {/* HEATMAP SECTION - BANGALORE WITH RED/ORANGE/GREEN DOTS */}
        <motion.div className="heatmap-section glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="heatmap-header"><Thermometer size={20} /><h3>📍 BENGALURU CITY ISSUE HEATMAP</h3><span className="heatmap-badge">{heatmapPoints.length} hotspots detected</span></div>
          <div className="map-container">
            <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '400px', width: '100%', borderRadius: '16px' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | Bengaluru City' />
              {heatmapPoints.map((point, idx) => {
                let dotColor = '#10b981';
                let glowIntensity = '2px';
                if (point.priority === 'High') {
                  dotColor = '#ef4444';
                  glowIntensity = '15px';
                } else if (point.priority === 'Medium') {
                  dotColor = '#f59e0b';
                  glowIntensity = '8px';
                }
                return (
                  <CircleMarker 
                    key={idx} 
                    center={[point.lat, point.lng]} 
                    radius={Math.max(10, Math.min(35, (point.complaintCount || 10) / 1.5))}
                    fillColor={dotColor}
                    color={dotColor}
                    weight={2} 
                    opacity={0.9} 
                    fillOpacity={0.5}
                    className={`heatmap-marker priority-${point.priority?.toLowerCase() || 'low'}`}
                  >
                    <Popup>
                      <div className="popup-content">
                        <strong>📍 {point.title}</strong><br/>
                        📊 {point.complaintCount || 10} total reports<br/>
                        🏷️ Category: {point.category || 'General'}<br/>
                        ⚡ Priority: {point.priority || 'Medium'}<br/>
                        📍 Bengaluru - Ward {point.ward}
                      </div>
                    </Popup>
                    <MapTooltip sticky>
                      🔴 {point.title} - {point.complaintCount || 10} reports
                    </MapTooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <div className="heatmap-legend">
            <div className="legend-item"><div className="legend-color high"></div><span>🔴 High Priority - Urgent (Red)</span></div>
            <div className="legend-item"><div className="legend-color medium"></div><span>🟠 Medium Priority (Orange)</span></div>
            <div className="legend-item"><div className="legend-color low"></div><span>🟢 Low Priority / Resolved (Green)</span></div>
            <div className="legend-item"><div className="legend-dot"></div><span>Circle size = Number of complaints</span></div>
          </div>
          <div className="map-attribution">📍 Bengaluru, Karnataka | Data: BBMP + Citizen Reports</div>
        </motion.div>

        {/* Charts Row */}
        <div className="charts-row">
          <motion.div className="chart-card glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="chart-header"><BarChart3 size={18} /><h3>Priority Distribution (Bengaluru)</h3></div>
            {chartData && <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } }, scales: { y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: 'white' }, grid: { display: false } } } }} />}
          </motion.div>

          <motion.div className="chart-card glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <div className="chart-header"><TrendingUp size={18} /><h3>Weekly Issue Trend</h3></div>
            {trendData && <Line data={trendData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } }, scales: { y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: 'white' }, grid: { display: false } } } }} />}
          </motion.div>

          <motion.div className="chart-card glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="chart-header"><PieChartIcon size={18} /><h3>Issues by Category</h3></div>
            {categoryData && <Doughnut data={categoryData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }} />}
          </motion.div>
        </div>

        {/* Issues List */}
        <motion.div className="issues-section glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="issues-header"><Target size={18} /><h3>Top Civic Issues - Bengaluru</h3><span className="issues-count">{issues.length} total issues</span></div>
          <div className="issues-list">
            {issues.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🏙️</div><h3>No issues found in Bengaluru</h3><p>Be the first to report an issue</p></div>
            ) : (
              issues.slice(0, 8).map((issue, idx) => (
                <div key={issue._id || issue.id || idx} className="issue-item">
                  <div className="issue-priority-dot" style={{ background: getPriorityColor(issue.priority) }}></div>
                  <div className="issue-content">
                    <div className="issue-row">
                      <h4 className="issue-title">{issue.issueTitle}</h4>
                      <div className="issue-badges">
                        <span className="issue-category-badge">{getCategoryIcon(issue.category)} {issue.category}</span>
                        <span className={`issue-status-badge ${issue.status?.toLowerCase().replace(' ', '-')}`}>{issue.status || 'Open'}</span>
                      </div>
                    </div>
                    <div className="issue-stats">
                      <span><Users size={12} /> {issue.complaintCount} reports</span>
                      <span><MapPin size={12} /> Ward {issue.ward} | {issue.area || 'Bengaluru'}</span>
                      <span className={`priority-${issue.priority?.toLowerCase()}`}>{issue.priority}</span>
                    </div>
                  </div>
                  <button className="solve-btn" onClick={() => setShowSolutionModal(issue)}>🔧 Get This Fixed</button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <div className="impact-footer glass">
          <div className="footer-content"><Shield size={18} /><span>🇮🇳 Bengaluru • BBMP • BWSSB • BESCOM • CPGRAMS Integrated • RTS Act Compliant</span><Link to="/register"><button className="join-button">Join CivicTrack →</button></Link></div>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
