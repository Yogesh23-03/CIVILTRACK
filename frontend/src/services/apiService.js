import api from './api';

const normalizeComplaint = (complaint) => ({
  ...complaint,
  id: complaint._id || complaint.id,
  ward: complaint.location?.ward || complaint.ward,
  date: complaint.createdAt || complaint.date,
  upvotes: complaint.upvoteCount ?? complaint.upvotes?.length ?? complaint.upvotes ?? 0,
  locationText: complaint.location?.address || complaint.location || ''
});

// Fetch complaints from backend
export const fetchComplaints = async () => {
  try {
    const response = await api.get('/complaints');
    return (response.data || []).map(normalizeComplaint);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return [];
  }
};

// Fetch issues from backend
export const fetchIssues = async () => {
  try {
    const response = await api.get('/issues');
    return response.data;
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
};

// Create complaint
export const createComplaint = async (data) => {
  try {
    const response = await api.post('/complaints', data);
    return normalizeComplaint(response.data);
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw error;
  }
};

// Fetch users from backend
export const fetchUsers = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data ? [response.data] : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Fetch posts from backend (complaints)
export const fetchPosts = async () => {
  try {
    const response = await api.get('/complaints');
    return (response.data || []).map(normalizeComplaint);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

// Fetch comments (issues)
export const fetchComments = async (postId) => {
  try {
    const response = await api.get(`/issues/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Fetch community posts (public data)
export const fetchCommunityPosts = async () => {
  try {
    // Fetch public issues
    const response = await api.get('/public/issues');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return [];
  }
};

// Fetch civic issues
export const fetchCivicIssues = async () => {
  try {
    const response = await api.get('/issues');
    return response.data;
  } catch (error) {
    console.error('Error fetching civic issues:', error);
    return [];
  }
};

// Vote on an issue
export const voteOnIssue = async (issueId, voteType) => {
  try {
    const type = voteType === 'not_fixed' ? 'notFixed' : voteType;
    const response = await api.post(`/public/issues/${issueId}/vote`, { type });
    return response.data;
  } catch (error) {
    console.error('Error voting on issue:', error);
    throw error;
  }
};

export const upvoteIssue = async (issueId) => {
  const response = await api.post(`/issues/${issueId}/upvote`);
  return response.data;
};

export const updateIssueStatus = async (issueId, status) => {
  const response = await api.patch(`/issues/${issueId}/status`, { status });
  return response.data;
};

export const updateComplaintStatus = async (complaintId, status) => {
  const response = await api.put(`/complaints/${complaintId}/status`, { status });
  return response.data;
};

export const checkDuplicateComplaint = async (data) => {
  const response = await api.post('/complaints/check-duplicate', data);
  return response.data;
};

export const importComplaint = async (data) => {
  const response = await api.post('/import/complaint', data);
  return response.data;
};

export const fetchRedditHotPosts = async () => {
  const response = await api.get('/import/reddit/hot');
  return response.data || [];
};

export const fetchRedditPostByUrl = async (url) => {
  const response = await api.get('/import/reddit/post', { params: { url } });
  return response.data;
};

export const fetchAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const deleteAdminComplaint = async (complaintId) => {
  const response = await api.delete(`/admin/complaints/${complaintId}`);
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const fetchCallComplaints = async () => {
  const response = await api.get('/call-complaints');
  return response.data || [];
};

export const updateCallComplaintStatus = async (complaintId, status) => {
  const response = await api.patch(`/call-complaints/${complaintId}/status`, { status });
  return response.data;
};

export const askChatbotComplaintQuestion = async (question) => {
  const response = await api.post('/chatbot/query', { question });
  return response.data;
};
