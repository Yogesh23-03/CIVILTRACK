import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatbaseTools from './components/ChatbaseTools';
import VoiceComplaintButton from './components/VoiceComplaintButton';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ReportComplaint from './pages/ReportComplaint';
import CommunityFeed from './pages/CommunityFeed';
import IssueDashboard from './pages/IssueDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import AdminPanel from './pages/AdminPanel';
import PublicDashboard from './pages/PublicDashboard';
import WardDashboard from './pages/WardDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const FloatingVoiceComplaint = () => {
  const { user } = useAuth();

  if (!user || user.role === 'admin') return null;

  return <VoiceComplaintButton floating />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <ChatbaseTools />
          <FloatingVoiceComplaint />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/public-dashboard" element={<PublicDashboard />} />
            <Route path="/ward-dashboard" element={<WardDashboard />} />
            <Route 
              path="/issues" 
              element={
                <ProtectedRoute>
                  <IssueDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
  path="/admin" 
  element={
    <AdminRoute>
      <AdminPanel />
    </AdminRoute>
  } 
/>
            <Route 
              path="/report" 
              element={
                <ProtectedRoute>
                  <ReportComplaint />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
