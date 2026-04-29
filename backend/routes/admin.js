const router = require('express').Router();
const Complaint = require('../models/Complaint');
const CallComplaint = require('../models/CallComplaint');
const Issue = require('../models/Issue');
const User = require('../models/User');
const auth = require('../middleware/auth');

const isCivicTrackAdminEmail = (email = '') => email.toLowerCase().endsWith('@civictrack.com');

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin' && !isCivicTrackAdminEmail(req.user?.email)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const normalizeComplaint = (complaint) => ({
  id: complaint._id.toString(),
  _id: complaint._id.toString(),
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  ward: complaint.location?.ward,
  location: complaint.location,
  status: complaint.status,
  userId: (complaint.userId?._id || complaint.userId)?.toString(),
  userName: complaint.userId?.name || 'Unknown',
  userEmail: complaint.userId?.email || '',
  upvotes: complaint.upvoteCount || complaint.upvotes?.length || 0,
  date: complaint.createdAt,
  createdAt: complaint.createdAt,
  issueId: complaint.issueId?.toString(),
  source: complaint.source
});

const normalizeCallComplaint = (complaint) => ({
  id: complaint._id.toString(),
  _id: complaint._id.toString(),
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  ward: complaint.location?.ward,
  location: complaint.location,
  status: complaint.status,
  userId: complaint.userId?.toString(),
  userName: complaint.callerName || 'Phone caller',
  userEmail: complaint.callerEmail || '',
  upvotes: 0,
  date: complaint.createdAt,
  createdAt: complaint.createdAt,
  issueId: null,
  source: complaint.source,
  severity: complaint.severity,
  callerPhone: complaint.callerPhone,
  isCallComplaint: true
});

const normalizeIssue = (issue) => ({
  id: issue._id.toString(),
  _id: issue._id.toString(),
  issueTitle: issue.issueTitle,
  description: issue.description,
  category: issue.category,
  ward: issue.ward,
  priority: issue.priority,
  status: issue.status,
  complaintCount: issue.complaintCount,
  initialComplaintCount: issue.initialComplaintCount,
  complaintIds: issue.complaintIds.map(id => id.toString()),
  assignedDepartment: issue.assignedDepartment,
  votes: issue.votes,
  impactMetrics: issue.impactMetrics,
  location: issue.location,
  createdAt: issue.createdAt
});

const buildMetrics = (issues, complaints) => {
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
  const highPriorityIssues = issues.filter(i => i.priority === 'High').length;
  const totalComplaints = complaints.length;
  const categories = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'];
  const categoryImpact = {};

  categories.forEach(category => {
    const catIssues = issues.filter(i => i.category === category);
    const catComplaints = complaints.filter(c => c.category === category);
    const resolved = catIssues.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
    categoryImpact[category] = {
      totalIssues: catIssues.length,
      totalComplaints: catComplaints.length,
      resolved,
      improvement: catIssues.length > 0 ? (resolved / catIssues.length) * 100 : 0
    };
  });

  return {
    summary: {
      totalIssues,
      resolvedIssues,
      highPriorityIssues,
      totalComplaints,
      resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(1) : 0
    },
    categoryImpact
  };
};

router.get('/dashboard', auth, requireAdmin, async (req, res) => {
  try {
    const [issues, complaints, callComplaints, users] = await Promise.all([
      Issue.find().sort({ createdAt: -1 }),
      Complaint.find().populate('userId', 'name email role').sort({ createdAt: -1 }),
      CallComplaint.find().sort({ createdAt: -1 }),
      User.find().select('-password').sort({ createdAt: -1 })
    ]);

    const normalizedIssues = issues.map(normalizeIssue);
    const normalizedComplaints = [
      ...complaints.map(normalizeComplaint),
      ...callComplaints.map(normalizeCallComplaint)
    ];

    res.json({
      issues: normalizedIssues,
      complaints: normalizedComplaints,
      users: users.map(user => ({
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward,
        points: user.points,
        createdAt: user.createdAt
      })),
      metrics: buildMetrics(normalizedIssues, normalizedComplaints)
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/complaints/:id', auth, requireAdmin, async (req, res) => {
  try {
    const callComplaint = await CallComplaint.findByIdAndDelete(req.params.id);
    if (callComplaint) return res.json({ success: true });

    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.issueId) {
      const issue = await Issue.findById(complaint.issueId);
      if (issue) {
        issue.complaintIds = issue.complaintIds.filter(id => id.toString() !== complaint._id.toString());
        issue.complaintCount = issue.complaintIds.length;
        await issue.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin user' });

    await Complaint.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
