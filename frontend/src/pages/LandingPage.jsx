import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, Clock, 
  TrendingUp, Users, Trophy, Zap, MapPin, Bell, 
  ArrowRight, BarChart3, Eye, Sparkles, Target, 
  Award, Globe, Smartphone, Database, Cloud, Lock,
  LayoutDashboard, FileText, Send, UserPlus, LogIn
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const { user } = useAuth();
  const [isCityFixed, setIsCityFixed] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [index, setIndex] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  
  const fullText = "Unreported issues. Delayed actions. No accountability.";
  
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    responseTime: 0,
    efficiency: 0,
  });

  const [liveFeed, setLiveFeed] = useState([
    { id: 1, type: "alert", text: "New incident reported in Sector 11", time: "Just now", location: "North Zone", priority: "High" },
    { id: 2, type: "alert", text: "Infrastructure issue detected", time: "2 min ago", location: "Central District", priority: "Medium" },
    { id: 3, type: "resolved", text: "Service restored successfully", time: "5 min ago", location: "West End", priority: "Resolved" },
    { id: 4, type: "alert", text: "Maintenance required", time: "12 min ago", location: "East Side", priority: "High" },
    { id: 5, type: "resolved", text: "Issue resolved by team", time: "18 min ago", location: "South Zone", priority: "Resolved" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newIssues = [
        { type: "alert", text: `New incident in Ward ${Math.floor(Math.random() * 12) + 1}`, location: "Priority Zone", priority: "Critical" },
        { type: "resolved", text: `Service restored in Sector ${Math.floor(Math.random() * 12) + 1}`, location: "Urban Area", priority: "Resolved" },
      ];
      const randomIssue = newIssues[Math.floor(Math.random() * newIssues.length)];
      const newItem = {
        id: Date.now(),
        type: randomIssue.type,
        text: randomIssue.text,
        time: "Just now",
        location: randomIssue.location,
        priority: randomIssue.priority
      };
      setLiveFeed(prev => [newItem, ...prev].slice(0, 8));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + fullText[index]);
        setIndex(prev => prev + 1);
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  useEffect(() => {
    const animateValue = (start, end, duration, setter) => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setter(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    animateValue(0, 2847, 2000, (val) => setStats(prev => ({ ...prev, total: val })));
    animateValue(0, 1892, 2000, (val) => setStats(prev => ({ ...prev, resolved: val })));
    animateValue(0, 48, 2000, (val) => setStats(prev => ({ ...prev, responseTime: val })));
    animateValue(0, 94, 2000, (val) => setStats(prev => ({ ...prev, efficiency: val })));
  
  }, []);

  const handleFixCity = () => {
    setIsCityFixed(true);
    setStats({
      total: 2847,
      resolved: 2672,
      responseTime: 2.4,
      efficiency: 98,
    });
  };

  const features = [
    { icon: <Zap size={28} />, title: "Smart Resolution", desc: "AI-powered prioritization for critical issues", color: "#667eea", metric: "-65% response time" },
    { icon: <Shield size={28} />, title: "SLA Guarantee", desc: "7-day resolution commitment with escalation", color: "#10b981", metric: "98% compliance" },
    { icon: <TrendingUp size={28} />, title: "Live Analytics", desc: "Real-time dashboard with actionable insights", color: "#f59e0b", metric: "24/7 monitoring" },
    { icon: <Users size={28} />, title: "Community Driven", desc: "Collective validation and transparency", color: "#8b5cf6", metric: "15k+ active" },
    { icon: <Bell size={28} />, title: "Instant Alerts", desc: "Real-time notifications on progress", color: "#ec4899", metric: "< 2min delay" },
    { icon: <Trophy size={28} />, title: "Impact Rewards", desc: "Recognition for active participation", color: "#06b6d4", metric: "Impact points" },
  ];

  const coreMetrics = [
    { value: "+246%", label: "Resolution Rate", trend: "up", icon: <TrendingUp size={16} /> },
    { value: "-65%", label: "Response Time", trend: "down", icon: <Clock size={16} /> },
    { value: "15K+", label: "Active Users", trend: "up", icon: <Users size={16} /> },
    { value: "4.92", label: "Rating", trend: "up", icon: <Award size={16} /> },
  ];

  const statsCards = [
    { icon: <FileText size={28} />, value: stats.total.toLocaleString(), label: "Total Incidents", trend: "+124% vs last month" },
    { icon: <CheckCircle size={28} />, value: stats.resolved.toLocaleString(), label: "Resolved Cases", trend: "+89% resolution rate" },
    { icon: <Clock size={28} />, value: `${stats.responseTime}h`, label: "Avg Response", trend: "-65% faster" },
    { icon: <BarChart3 size={28} />, value: `${stats.efficiency}%`, label: "Efficiency Score", trend: "A+ Grade" },
   
  ];

  return (
    <div className={`landing-page ${isCityFixed ? 'city-fixed' : ''}`}>
      
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb2"></div>
        <div className="gradient-orb3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <motion.div 
            className="crisis-badge"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertTriangle size={14} />
            <span>{!isCityFixed ? 'CRISIS MODE ACTIVE' : 'TRANSFORMATION COMPLETE'}</span>
          </motion.div>
          
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {!isCityFixed ? (
              <>Your City is <span className="highlight-red">Struggling</span></>
            ) : (
              <>Powered by <span className="highlight-green">CivicTrack Intelligence</span></>
            )}
          </motion.h1>
          
          <motion.div 
            className="typing-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="hero-subtitle">
              {!isCityFixed ? (
                <>
                  <span className="typed-prefix">
                    <AlertTriangle size={14} className="inline-icon" />
                  </span>
                  {typedText}
                  <span className="cursor">|</span>
                </>
              ) : (
                'Transparent • Accountable • Efficient • Intelligent'
              )}
            </p>
          </motion.div>
          
          <motion.div 
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {user ? (
              <Link to="/report">
                <button className="btn-primary">
                  <Send size={18} />
                  <span>Report Incident</span>
                  <ArrowRight size={16} />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <button className="btn-primary">
                    <UserPlus size={18} />
                    <span>Get Started</span>
                    <ArrowRight size={16} />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="btn-secondary">
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </button>
                </Link>
              </>
            )}
            <Link to="/dashboard">
              <button className="btn-outline">
                <LayoutDashboard size={18} />
                <span>Live Dashboard</span>
              </button>
            </Link>
          </motion.div>

          {!isCityFixed && (
            <motion.button 
              className="transform-btn"
              onClick={handleFixCity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <Sparkles size={18} />
              <span>Initiate City Transformation</span>
            </motion.button>
          )}

          {/* Core Metrics */}
          <motion.div 
            className="metrics-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {coreMetrics.map((metric, idx) => (
              <div key={idx} className="metric-chip">
                {metric.icon}
                <span className="metric-value">{metric.value}</span>
                <span className="metric-label">{metric.label}</span>
                <span className={`metric-trend ${metric.trend}`}>
                  {metric.trend === 'up' ? '↑' : '↓'}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-header">
          <h2 className="section-title">Performance <span className="highlight">Metrics</span></h2>
          <p className="section-subtitle">Real-time impact measurement</p>
        </div>
        <div className="stats-grid">
          {statsCards.map((stat, idx) => (
            <motion.div 
              key={idx}
              className="stat-card glass"
              whileHover={{ scale: 1.03, y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-trend">{stat.trend}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="live-feed-section">
        <div className="section-header">
          <div className="pulse-indicator"></div>
          <h2 className="section-title">Incident Stream</h2>
          <span className="live-tag">LIVE</span>
        </div>
        
        <div className="feed-container glass">
          <div className="feed-header">
            <span>Location</span>
            <span>Event</span>
            <span>Priority</span>
            <span>Timestamp</span>
          </div>
          {liveFeed.map((item, idx) => (
            <motion.div 
              key={item.id}
              className={`feed-row ${item.type}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              
            >
              <div className="feed-location">
                <MapPin size={12} />
                <span>{item.location}</span>
              </div>
              <div className="feed-message">{item.text}</div>
              <div className={`feed-priority priority-${item.priority?.toLowerCase() || 'medium'}`}>
                {item.priority || 'Standard'}
              </div>
              <div className="feed-item ${item.type}">
  <div className="feed-icon">{item.icon}</div>
  <div className="feed-content">
    <p className="feed-text">{item.text}</p>
    <span className="feed-time">{item.time}</span>
    {/* ADD VERIFICATION BADGE */}
    <div style={{ marginTop: '4px' }}>
      <span style={{ fontSize: '10px', background: '#10b98120', padding: '2px 6px', borderRadius: '10px', color: '#10b981' }}>
        ✓ Community Verified
      </span>
    </div>
  </div>
</div>
              <div className="feed-timestamp">{item.time}</div>
            </motion.div>
            
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Platform <span className="highlight">Capabilities</span></h2>
          <p className="section-subtitle">Enterprise-grade urban management solution</p>
        </div>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              className="feature-card glass"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
              onHoverStart={() => setHoveredFeature(idx)}
              onHoverEnd={() => setHoveredFeature(null)}
            >
              <div className="feature-icon" style={{ color: feature.color }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <div className="feature-metric">{feature.metric}</div>
              {hoveredFeature === idx && (
                <motion.div 
                  className="feature-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ background: `${feature.color}15` }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Transformation Showcase */}
      <section className="transformation-section">
        <div className="section-header">
          <h2 className="section-title">Before & <span className="highlight">After</span></h2>
          <p className="section-subtitle">Measurable impact of citizen engagement</p>
        </div>
        <div className="transformation-wrapper">
          <div className="transformation-container">
            <motion.div 
              className="transformation-card before"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="card-header">
                <AlertTriangle size={20} />
                <span>Legacy System</span>
              </div>
              <div className="metrics-display">
                <div className="metric-item">
                  <span className="metric-title">Response Time</span>
                  <span className="metric-value negative">72+ hours</span>
                </div>
                <div className="metric-item">
                  <span className="metric-title">Resolution Rate</span>
                  <span className="metric-value negative">32%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-title">Transparency</span>
                  <span className="metric-value negative">Limited</span>
                </div>
              </div>
            </motion.div>
            
            <div className="transformation-arrow">
              <ArrowRight size={32} />
            </div>
            
            <motion.div 
              className="transformation-card after"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <div className="card-header">
                <CheckCircle size={20} />
                <span>CivicTrack Platform</span>
              </div>
              <div className="metrics-display">
                <div className="metric-item">
                  <span className="metric-title">Response Time</span>
                  <span className="metric-value positive">2.4 hours</span>
                </div>
                <div className="metric-item">
                  <span className="metric-title">Resolution Rate</span>
                  <span className="metric-value positive">94%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-title">Transparency</span>
                  <span className="metric-value positive">Full Audit Trail</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="impact-stats">
            <div className="impact-badge">
              <Zap size={16} />
              <span>95% Faster Resolution</span>
            </div>
            <div className="impact-badge">
              <Trophy size={16} />
              <span>Industry Leading Platform</span>
            </div>
            <div className="impact-badge">
              <Globe size={16} />
              <span>Trusted by 15k+ Citizens</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="enterprise-section">
        <div className="enterprise-grid">
          <motion.div 
            className="enterprise-card glass"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <Database size={32} className="enterprise-icon" />
            <h3>Secure Infrastructure</h3>
            <p>Enterprise-grade security with end-to-end encryption</p>
          </motion.div>
          <motion.div 
            className="enterprise-card glass"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Cloud size={32} className="enterprise-icon" />
            <h3>Cloud Native</h3>
            <p>Scalable architecture with 99.9% uptime guarantee</p>
          </motion.div>
          <motion.div 
            className="enterprise-card glass"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Smartphone size={32} className="enterprise-icon" />
            <h3>Multi-Platform</h3>
            <p>Access from any device, anywhere, anytime</p>
          </motion.div>
          <motion.div 
            className="enterprise-card glass"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Lock size={32} className="enterprise-icon" />
            <h3>Data Protection</h3>
            <p>GDPR compliant with privacy-first approach</p>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <motion.div 
          className="cta-container glass"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <div className="cta-glow"></div>
          <Target size={48} className="cta-icon" />
          <h2 className="cta-title">Join the Urban Intelligence Revolution</h2>
          <p className="cta-subtitle">15,000+ citizens already transforming their cities</p>
          {user ? (
            <Link to="/report">
              <button className="cta-button">
                <Send size={18} />
                <span>Report Incident Now</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          ) : (
            <div className="cta-button-group">
              <Link to="/register">
                <button className="cta-button primary">
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </button>
              </Link>
              <Link to="/login">
                <button className="cta-button secondary">
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>
              </Link>
            </div>
          )}
          <div className="cta-features">
            <span><CheckCircle size={14} /> No commitment</span>
            <span><CheckCircle size={14} /> Free tier available</span>
            <span><CheckCircle size={14} /> Priority support</span>
            <span><CheckCircle size={14} /> Enterprise ready</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;