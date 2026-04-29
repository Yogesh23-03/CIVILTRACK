const router = require('express').Router();
const Issue = require('../models/Issue');
const Complaint = require('../models/Complaint');

// Get issues by ward (public)
router.get('/issues', async (req, res) => {
  try {
    const { ward, category, priority, status, limit = 20 } = req.query;
    let query = {};
    
    if (ward && ward !== 'all') query.ward = ward;
    if (category && category !== 'all') query.category = category;
    if (priority && priority !== 'all') query.priority = priority;
    if (status && status !== 'all') query.status = status;
    
    const issues = await Issue.find(query)
      .sort({ priority: -1, complaintCount: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ward statistics
router.get('/stats/:ward', async (req, res) => {
  try {
    const { ward } = req.params;
    let query = {};
    if (ward !== 'all') query.ward = ward;
    
    const issues = await Issue.find(query);
    
    const totalIssues = issues.length;
    const highPriority = issues.filter(i => i.priority === 'High').length;
    const mediumPriority = issues.filter(i => i.priority === 'Medium').length;
    const lowPriority = issues.filter(i => i.priority === 'Low').length;
    const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
    const overdue = issues.filter(i => i.isOverdue === true).length;
    const pendingVerification = issues.filter(i => i.status === 'Pending Verification').length;
    
    const totalAffected = issues.reduce((acc, i) => acc + (i.votes?.affected || 0), 0);
    const totalComplaints = issues.reduce((acc, i) => acc + i.complaintCount, 0);
    const resolvedComplaints = issues.reduce((acc, i) => acc + (i.status === 'Resolved' || i.status === 'Verified' ? i.complaintCount : 0), 0);
    
    res.json({
      ward,
      totalIssues,
      highPriority,
      mediumPriority,
      lowPriority,
      resolved,
      overdue,
      pendingVerification,
      totalAffected,
      totalComplaints,
      resolvedComplaints,
      resolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const issues = await Issue.find();
    
    const heatmapData = issues.map(issue => ({
      lat: issue.location?.lat || 28.6139 + (Math.random() - 0.5) * 0.1,
      lng: issue.location?.lng || 77.2090 + (Math.random() - 0.5) * 0.1,
      intensity: Math.min(issue.complaintCount / 50, 1),
      complaintCount: issue.complaintCount,
      priority: issue.priority,
      category: issue.category,
      title: issue.issueTitle,
      id: issue._id
    }));
    
    res.json(heatmapData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark issue as affecting me
router.post('/issues/:id/affect', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    issue.votes.affected = (issue.votes.affected || 0) + 1;
    await issue.save();
    
    res.json({ affected: issue.votes.affected });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on issue resolution
router.post('/issues/:id/vote', async (req, res) => {
  try {
    const { type } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    if (type === 'fixed') {
      issue.votes.fixed = (issue.votes.fixed || 0) + 1;
    } else if (type === 'notFixed') {
      issue.votes.notFixed = (issue.votes.notFixed || 0) + 1;
    }
    
    // Update community trust score
    const totalVotes = issue.votes.fixed + issue.votes.notFixed;
    if (totalVotes > 0) {
      issue.impactMetrics.communityTrustScore = (issue.votes.fixed / totalVotes) * 100;
    }
    
    await issue.save();
    
    res.json({ 
      fixed: issue.votes.fixed, 
      notFixed: issue.votes.notFixed,
      trustScore: issue.impactMetrics.communityTrustScore
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timeline for an issue
router.get('/issues/:id/timeline', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).select('timeline status createdAt');
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;