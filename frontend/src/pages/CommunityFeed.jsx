import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RedditImportCard from '../components/RedditImportCard';
import * as apiService from '../services/apiService';
import { 
  TrendingUp, Users, MapPin, Bell, 
  ArrowRight, RefreshCw, Filter, Search,
  AlertCircle, CheckCircle, Clock, Flame,
  Languages, IndianRupee, Home, Building
} from 'lucide-react';
import './CommunityFeed.css';

const CommunityFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [redditLink, setRedditLink] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    civicRelated: 0,
    imported: 0
  });

  // Relevant civic keywords for filtering
  const civicKeywords = [
    'pothole', 'road', 'street', 'garbage', 'waste', 'trash', 'dump',
    'water', 'pipe', 'leak', 'drainage', 'sewage', 'flood',
    'light', 'power', 'electric', 'outage', 'pole',
    'bridge', 'construction', 'repair', 'broken', 'damage',
    'park', 'garden', 'clean', 'sanitation', 'infrastructure'
  ];

  // English detection (simple check for common English words)
  const englishWords = ['the', 'and', 'for', 'with', 'this', 'that', 'have', 'from', 'not', 'are'];

  const isEnglishText = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    const wordCount = englishWords.filter(word => lowerText.includes(word)).length;
    return [...text].every(char => char.charCodeAt(0) <= 127) || wordCount >= 1;
  };

  const isCivicRelated = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return civicKeywords.some(keyword => lowerText.includes(keyword));
  };

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  const loadCommunityPosts = async () => {
    setLoading(true);
    try {
      const redditPosts = await apiService.fetchRedditHotPosts();
      const allPosts = redditPosts
        .map(post => ({
          ...post,
          content: post.content || '',
          isEnglish: isEnglishText(`${post.title} ${post.content || ''}`),
          isCivic: isCivicRelated(`${post.title} ${post.content || ''}`)
        }))
        .filter(post => post.isEnglish && post.isCivic);
      
      // Remove duplicates and sort by score
      const uniquePosts = [];
      const seenTitles = new Set();
      for (const post of allPosts) {
        const normalizedTitle = post.title.toLowerCase().substring(0, 50);
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          uniquePosts.push(post);
        }
      }
      
      uniquePosts.sort((a, b) => b.created - a.created || b.score - a.score);
      
      setPosts(uniquePosts.slice(0, 30));
      setStats({
        total: uniquePosts.length,
        civicRelated: uniquePosts.filter(p => p.isCivic).length,
        imported: 0
      });
      
    } catch (error) {
      console.error('Error loading community feed:', error);
      // Fallback to mock data if API fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockPosts = [
      {
        id: 'mock1',
        title: 'Large pothole on MG Road causing accidents daily',
        content: 'This pothole has been here for 3 months. Multiple accidents reported. Please fix urgently.',
        score: 245,
        numComments: 56,
        author: 'citizen_rajesh',
        created: Date.now() / 1000 - 3600,
        url: '#',
        subreddit: 'india',
        isEnglish: true,
        isCivic: true
      },
      {
        id: 'mock2',
        title: 'Garbage not collected in Sector 12 for 2 weeks',
        content: 'The garbage trucks haven\'t visited our area. Bad smell and health hazard.',
        score: 189,
        numComments: 34,
        author: 'concerned_citizen',
        created: Date.now() / 1000 - 7200,
        url: '#',
        subreddit: 'delhi',
        isEnglish: true,
        isCivic: true
      },
      {
        id: 'mock3',
        title: 'Street lights not working on Ring Road',
        content: 'Complete darkness on the main road. Very dangerous for pedestrians and vehicles.',
        score: 156,
        numComments: 28,
        author: 'night_commuter',
        created: Date.now() / 1000 - 10800,
        url: '#',
        subreddit: 'bangalore',
        isEnglish: true,
        isCivic: true
      },
      {
        id: 'mock4',
        title: 'Water pipe burst near City Mall',
        content: 'Water leaking since yesterday. Wasting thousands of liters. No response from authorities.',
        score: 234,
        numComments: 67,
        author: 'local_resident',
        created: Date.now() / 1000 - 5400,
        url: '#',
        subreddit: 'mumbai',
        isEnglish: true,
        isCivic: true
      },
      {
        id: 'mock5',
        title: 'Broken manhole cover near school',
        content: 'Children crossing this area are at risk. Need immediate repair.',
        score: 312,
        numComments: 89,
        author: 'parent_concern',
        created: Date.now() / 1000 - 9000,
        url: '#',
        subreddit: 'chennai',
        isEnglish: true,
        isCivic: true
      }
    ];
    setPosts(mockPosts);
    setStats({
      total: 5,
      civicRelated: 5,
      imported: 0
    });
  };

  const normalizeRedditUrl = (url) => {
    const parsed = new URL(url.trim());
    if (!parsed.hostname.includes('reddit.com')) {
      throw new Error('Please paste a Reddit post link');
    }
    parsed.search = '';
    parsed.hash = '';
    const pathname = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`;
    return `https://www.reddit.com${pathname}.json?raw_json=1`;
  };

  const loadRedditLink = async (e) => {
    e.preventDefault();
    try {
      normalizeRedditUrl(redditLink);
      const post = await apiService.fetchRedditPostByUrl(redditLink);

      setPosts(prev => [post, ...prev.filter(item => item.id !== post.id)]);
      setStats(prev => ({
        ...prev,
        total: posts.some(item => item.id === post.id) ? prev.total : prev.total + 1,
        civicRelated: posts.some(item => item.id === post.id) ? prev.civicRelated : prev.civicRelated + 1
      }));
      setRedditLink('');
    } catch (error) {
      alert(error.message || 'Could not load Reddit link');
    }
  };

  const getFilteredPosts = () => {
    let filtered = [...posts];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filter === 'trending') {
      filtered.sort((a, b) => b.score - a.score);
    } else if (filter === 'newest') {
      filtered.sort((a, b) => b.created - a.created);
    } else if (filter === 'mostCommented') {
      filtered.sort((a, b) => b.numComments - a.numComments);
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="community-page">
        <div className="community-bg">
          <div className="gradient-orb"></div>
          <div className="gradient-orb2"></div>
          <div className="grid-overlay"></div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Finding relevant civic issues from community...</p>
          <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Filtering English content about roads, water, garbage, electricity</p>
        </div>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <div className="community-page">
      <div className="community-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb2"></div>
        <div className="gradient-orb3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="community-container">
        {/* Header with Stats */}
        <motion.div 
          className="community-header glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-content">
            <div className="header-left">
              <TrendingUp size={28} className="header-icon" />
              <div>
                <h1>Civic Issues from Community</h1>
                <p>Filtered • English only • India-specific civic problems</p>
              </div>
            </div>
            <button className="refresh-btn" onClick={loadCommunityPosts}>
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
          
          {/* Filter Stats */}
          <div className="stats-row">
            <div className="stat-badge">
              <AlertCircle size={14} />
              <span>{stats.total} Total Discussions</span>
            </div>
            <div className="stat-badge">
              <CheckCircle size={14} />
              <span>{stats.civicRelated} Civic Related</span>
            </div>
            <div className="stat-badge">
              <Languages size={14} />
              <span>English Only</span>
            </div>
            <div className="stat-badge">
              <IndianRupee size={14} />
              <span>India Focused</span>
            </div>
            <div className="stat-badge">
              <Building size={14} />
              <span>{stats.imported} Imported</span>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="filters-bar glass">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search civic issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <form onSubmit={loadRedditLink} className="search-box">
            <input
              type="url"
              placeholder="Paste Reddit post link"
              value={redditLink}
              onChange={(e) => setRedditLink(e.target.value)}
            />
            <button type="submit" className="refresh-btn">
              <span>Load</span>
            </button>
          </form>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'trending' ? 'active' : ''}`}
              onClick={() => setFilter('trending')}
            >
              <Flame size={14} />
              <span>Trending</span>
            </button>
            <button 
              className={`filter-tab ${filter === 'newest' ? 'active' : ''}`}
              onClick={() => setFilter('newest')}
            >
              <Clock size={14} />
              <span>Newest</span>
            </button>
            <button 
              className={`filter-tab ${filter === 'mostCommented' ? 'active' : ''}`}
              onClick={() => setFilter('mostCommented')}
            >
              <Users size={14} />
              <span>Most Discussed</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="info-banner glass">
          <div className="info-icon">
            <Building size={20} />
          </div>
          <div className="info-content">
            <strong>🔍 What you see here:</strong>
            <p>Only English posts about roads, water, garbage, electricity, and infrastructure from Indian subreddits.</p>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {filteredPosts.length === 0 ? (
            <div className="empty-state glass">
              <div className="empty-icon">📭</div>
              <h3>No civic issues found</h3>
              <p>Try refreshing or check back later for new community discussions</p>
              <button className="refresh-empty-btn" onClick={loadCommunityPosts}>
                <RefreshCw size={16} />
                <span>Refresh Feed</span>
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <RedditImportCard 
                    post={post} 
                    onImport={(newComplaint) => {
                      setStats(prev => ({ ...prev, imported: prev.imported + 1 }));
                      alert(`✅ Imported: ${post.title.substring(0, 60)}...\nAdded to Ward ${newComplaint.ward}`);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Info Footer */}
        <div className="info-footer glass">
          <div className="footer-content">
            <span>📍 Showing only English civic issues from Indian communities</span>
            <span>🔄 Data refreshes automatically</span>
            <span>➕ Import issues to track with CivicTrack</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityFeed;
