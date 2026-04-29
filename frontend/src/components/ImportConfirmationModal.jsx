import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, AlertCircle, MapPin, 
  X, Send, Edit3
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const ImportConfirmationModal = ({ post, detectedCategory, onConfirm, onCancel }) => {
  const [selectedWard, setSelectedWard] = useState('');
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedDescription, setEditedDescription] = useState(
    post.content || post.selftext || 'Issue from community discussion'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(detectedCategory);

  const wards = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const categories = [
    { value: 'Roads', label: 'Roads & Potholes', icon: '🛣️' },
    { value: 'Sanitation', label: 'Garbage & Sanitation', icon: '🗑️' },
    { value: 'Water', label: 'Water Supply', icon: '💧' },
    { value: 'Electricity', label: 'Electricity & Lights', icon: '💡' },
    { value: 'Other', label: 'Other Issues', icon: '📌' }
  ];

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleConfirm = () => {
    if (!selectedWard) {
      alert('⚠️ Please select a ward');
      return;
    }
    onConfirm({
      title: editedTitle,
      description: editedDescription,
      category: selectedCategory,
      ward: selectedWard,
      location: `Ward ${selectedWard}`,
      sourceUrl: post.url,
      sourceAuthor: post.author,
      sourceScore: post.score
    });
  };

  return (
    <ModalPortal>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto'
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          style={{
            width: '90%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: '#0f0f1a',
            borderRadius: '28px',
            padding: '24px',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button 
            onClick={onCancel}
            style={{
              position: 'sticky',
              top: 0,
              float: 'right',
              width: '32px',
              height: '32px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              marginBottom: '10px'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ clear: 'both' }}></div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
            <h2 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '4px', fontWeight: 700 }}>Confirm Import</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>Review before adding to CivicTrack</p>
          </div>

          {/* Post Info */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{
                background: 'rgba(255, 69, 0, 0.15)',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '0.6rem',
                color: '#ff4500'
              }}>🔴 r/india</span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{post.score} upvotes</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>TITLE</span>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: 'rgba(79,70,229,0.15)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '2px 8px',
                    color: '#4f46e5',
                    fontSize: '0.6rem',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={10} /> {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.8rem',
                    marginBottom: '10px'
                  }}
                />
              ) : (
                <div style={{ color: 'white', fontSize: '0.85rem', marginBottom: '10px' }}>
                  {editedTitle.length > 80 ? editedTitle.substring(0, 80) + '...' : editedTitle}
                </div>
              )}

              {!isEditing && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>DESCRIPTION</span>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: '4px', lineHeight: 1.4 }}>
                    {editedDescription.length > 100 ? editedDescription.substring(0, 100) + '...' : editedDescription}
                  </div>
                </>
              )}

              {isEditing && (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.75rem',
                    resize: 'vertical',
                    marginTop: '8px'
                  }}
                />
              )}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'white', fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '8px',
                    background: selectedCategory === cat.value ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.05)',
                    border: selectedCategory === cat.value ? '1px solid #4f46e5' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: selectedCategory === cat.value ? '#4f46e5' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ward */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>Ward Number *</label>
            <select 
              value={selectedWard} 
              onChange={(e) => setSelectedWard(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.8rem'
              }}
            >
              <option value="">-- Select Ward --</option>
              {wards.map(w => <option key={w} value={w}>📍 Ward {w}</option>)}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button 
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} /> Confirm & Import
            </button>
          </div>

          {/* Note */}
          <div style={{
            padding: '8px',
            background: 'rgba(79,70,229,0.08)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.6rem',
            color: '#8b5cf6'
          }}>
            {/* Add Source Badge */}
<div className="import-source-badge">
  <span className="import-source-reddit">🔴 Source: Reddit r/india</span>
  <span className="import-upvote-count">📊 {post.score} people upvoted this issue</span>
</div>

{/* Add Impact Preview */}
<div className="import-impact-preview">
  <div className="impact-stat">
    <span>👥</span>
    <span>{post.score} people affected</span>
  </div>
  <div className="impact-stat">
    <span>💬</span>
    <span>{post.num_comments} discussions</span>
  </div>
  <div className="impact-stat">
    <span>⭐</span>
    <span>Community validated</span>
  </div>
</div>
            <AlertCircle size={10} />
            <span>This will be visible to all users and contribute to city metrics</span>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
    
  );
};

export default ImportConfirmationModal;