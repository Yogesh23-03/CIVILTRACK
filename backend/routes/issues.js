const router = require('express').Router();
const Issue = require('../models/Issue');
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { ward, category, priority, status, limit = 50 } = req.query;
    let query = {};
    if (ward && ward !== 'all') query.ward = ward;
    if (category && category !== 'all') query.category = category;
    if (priority && priority !== 'all') query.priority = priority;
    if (status && status !== 'all') query.status = status;
    const issues = await Issue.find(query).sort({ priority: -1, complaintCount: -1 }).limit(parseInt(limit));
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/:ward', async (req, res) => {
  try {
    const { ward } = req.params;
    const query = ward !== 'all' ? { ward } : {};
    const issues = await Issue.find(query);
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'Pending').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
    const highPriority = issues.filter(i => i.priority === 'High').length;
    res.json({ ward, total, pending, inProgress, resolved, highPriority });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (req.user.role === 'authority' && req.user.ward !== issue.ward) {
      return res.status(403).json({ message: 'Access denied' });
    }
    issue.status = status;
    if (status === 'Resolved') issue.resolvedAt = new Date();
    await issue.save();
    if (status === 'Resolved') {
      await Complaint.updateMany(
        { _id: { $in: issue.complaintIds } },
        { $set: { status: 'resolved' } }
      );
    }
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    issue.votes.affected = (issue.votes.affected || 0) + 1;
    issue.complaintCount = (issue.complaintCount || 0) + 1;
    if (issue.complaintCount >= 10) issue.priority = 'High';
    else if (issue.complaintCount >= 5) issue.priority = 'Medium';
    await issue.save();
    res.json({ success: true, complaintCount: issue.complaintCount, priority: issue.priority });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
