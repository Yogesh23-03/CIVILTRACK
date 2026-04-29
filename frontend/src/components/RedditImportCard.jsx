import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/apiService';
import ImportConfirmationModal from './ImportConfirmationModal';

const RedditImportCard = ({ post, onImport }) => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const categories = [
    { value: 'Roads', keywords: ['pothole', 'road', 'street', 'traffic'] },
    { value: 'Sanitation', keywords: ['garbage', 'waste', 'trash', 'dump', 'sewage'] },
    { value: 'Water', keywords: ['water', 'pipe', 'leak', 'drainage', 'flood'] },
    { value: 'Electricity', keywords: ['light', 'power', 'electric', 'outage'] },
    { value: 'Other', keywords: [] }
  ];

  const isCivicTrackReport = post.source === 'civictrack';

  const detectCategory = () => {
    const titleLower = (post.title || '').toLowerCase();
    const match = categories.find(cat => cat.keywords.some(keyword => titleLower.includes(keyword)));
    return post.category || match?.value || 'Other';
  };

  const handleImportClick = () => {
    if (!user) {
      alert('Please login to import civic issues');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmImport = async (importData) => {
    setImporting(true);
    setShowConfirmModal(false);

    try {
      const result = await apiService.importComplaint(importData);
      const complaint = result.complaint || {};
      const newComplaint = {
        ...complaint,
        id: complaint._id,
        ward: complaint.location?.ward || importData.ward,
        date: complaint.createdAt || new Date().toISOString(),
        upvotes: complaint.upvoteCount || importData.sourceScore || 0,
        isDuplicate: result.isDuplicate,
        duplicate: result.duplicate
      };

      setImported(true);
      if (onImport) onImport(newComplaint);
      alert(result.isDuplicate
        ? `Detected duplicate and added this Reddit complaint to: ${result.duplicate?.existingIssue?.title || 'existing issue'}`
        : 'Issue imported successfully!'
      );

      setTimeout(() => setImported(false), 3000);
    } catch (error) {
      console.error('Import failed:', error);
      alert(error.response?.data?.message || 'Failed to import. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (imported) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#10b981',
        marginBottom: '1rem'
      }}>
        <CheckCircle size={20} />
        <span>Imported successfully!</span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '1.2rem',
      marginBottom: '1rem'
    }}>
      {showConfirmModal && (
        <ImportConfirmationModal
          post={post}
          detectedCategory={detectCategory()}
          onConfirm={handleConfirmImport}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ background: 'rgba(255,69,0,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', color: '#ff4500' }}>
          {isCivicTrackReport ? 'CivicTrack Report' : `r/${post.subreddit || 'india'}`} - {post.author}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
          <span>{post.score} {isCivicTrackReport ? 'reports' : 'upvotes'}</span>
          <span>{post.num_comments || post.numComments || 0} comments</span>
        </div>
      </div>

      <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{post.title}</h4>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        {(post.content || post.selftext || 'Community discussion').substring(0, 150)}...
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ background: 'rgba(79,70,229,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', color: '#4f46e5' }}>
          Category: {detectCategory()}{post.ward ? ` | Ward ${post.ward}` : ''}
        </div>
        {!isCivicTrackReport && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>View</a>
            <button onClick={handleImportClick} disabled={importing} style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              border: 'none',
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              color: 'white',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}>
              {importing ? '...' : '+ Import'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedditImportCard;
