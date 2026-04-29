const router = require('express').Router();
const Issue = require('../models/Issue');
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');

// Get verification status for an issue (public - no auth required)
router.get('/:issueId/status', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    const verificationStats = issue.calculateVerificationPercentage();
    
    res.json({
      verificationStatus: issue.status === 'Verified' ? 'verified' : 'pending',
      verifiedCount: issue.votes?.fixed || 0,
      notFixedCount: issue.votes?.notFixed || 0,
      totalVotes: verificationStats.totalVotes,
      fixedPercentage: verificationStats.fixedPercentage,
      notFixedPercentage: verificationStats.notFixedPercentage,
      communityTrustScore: issue.impactMetrics?.communityTrustScore || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit verification vote
router.post('/:issueId/verify', auth, async (req, res) => {
  try {
    const { vote } = req.body;
    const issueId = req.params.issueId;
    const userId = req.user.id;
    
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    // Check if issue is in verification period
    if (issue.status !== 'Pending Verification') {
      return res.status(400).json({ message: 'Issue is not pending verification' });
    }
    
    // Check if user has already voted
    if (vote === 'fixed') {
      issue.votes.fixed = (issue.votes.fixed || 0) + 1;
    } else {
      issue.votes.notFixed = (issue.votes.notFixed || 0) + 1;
    }
    
    // Update verification status
    const newStatus = issue.updateVerificationStatus();
    
    // Update community trust score
    const totalVotes = (issue.votes.fixed || 0) + (issue.votes.notFixed || 0);
    issue.impactMetrics.communityTrustScore = totalVotes > 0 
      ? ((issue.votes.fixed || 0) / totalVotes) * 100 
      : 0;
    
    await issue.save();
    
    res.json({
      success: true,
      verificationStatus: newStatus,
      verifiedCount: issue.votes.fixed || 0,
      notFixedCount: issue.votes.notFixed || 0,
      fixedPercentage: totalVotes > 0 ? ((issue.votes.fixed || 0) / totalVotes) * 100 : 0,
      message: 'Vote recorded successfully'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin upload after image (resolution proof)
router.post('/:issueId/proof', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'authority') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { afterImage, resolutionNote } = req.body;
    const issue = await Issue.findById(req.params.issueId);
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    issue.afterImage = afterImage;
    issue.resolutionNote = resolutionNote;
    issue.status = 'Pending Verification';
    issue.verificationStatus = 'pending';
    issue.resolvedAt = new Date();
    
    await issue.save();
    
    res.json({ success: true, message: 'Resolution proof uploaded. Issue pending verification.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
