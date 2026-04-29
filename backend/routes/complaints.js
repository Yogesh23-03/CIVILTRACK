const router = require('express').Router();
const Complaint = require('../models/Complaint');
const Issue = require('../models/Issue');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { detectDuplicate } = require('../services/aiDuplicateDetector'); // Imported your new service

// ============== CHECK DUPLICATE API (AI POWERED) ==============
router.post('/check-duplicate', async (req, res) => {
  try {
    const { title, description, category, ward } = req.body;

    // 1. Fetch existing issues in the same ward and category
    // This reduces the data sent to AI for better accuracy and speed
    const existingIssues = await Issue.find({
      category,
      ward,
      status: { $nin: ['Resolved', 'Verified', 'Rejected'] }
    }).limit(10); // Limit to most recent 10 to stay within free tier limits

    if (existingIssues.length === 0) {
      return res.json({ isDuplicate: false });
    }

    // 2. Format the data for the AI service
    // We map issues to a simpler format so the AI understands them easily
    const formattedExisting = existingIssues.map(issue => ({
      id: issue._id,
      title: issue.issueTitle,
      description: issue.description || "No description provided",
      category: issue.category,
      ward: issue.ward
    }));

    // 3. Call your new Free AI Service (Groq/Llama)
    const aiResult = await detectDuplicate(
      { title, description, category, ward },
      formattedExisting
    );

    if (aiResult.isDuplicate && aiResult.confidence >= 0.7) {
      // Find the original issue object to return full details to the frontend
      const matchedIssue = existingIssues[aiResult.matchedIndex];

      return res.json({
        isDuplicate: true,
        existingIssue: {
          id: matchedIssue._id,
          title: matchedIssue.issueTitle,
          complaintCount: matchedIssue.complaintCount,
          upvotes: matchedIssue.votes?.affected || 0,
          priority: matchedIssue.priority,
          category: matchedIssue.category,
          ward: matchedIssue.ward,
          status: matchedIssue.status
        },
        similarity: aiResult.confidence,
        reason: aiResult.reason // Now you can show the user WHY it's a duplicate
      });
    }

    res.json({ isDuplicate: false });
  } catch (err) {
    console.error('AI Check Error:', err);
    res.status(500).json({ message: 'Server error during duplicate check' });
  }
});

// ============== UPVOTE EXISTING ISSUE ==============
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.votes.affected = (issue.votes.affected || 0) + 1;
    issue.complaintCount = (issue.complaintCount || 0) + 1;

    // Dynamic priority adjustment based on volume
    if (issue.complaintCount >= 10) issue.priority = 'High';
    else if (issue.complaintCount >= 5) issue.priority = 'Medium';
    else issue.priority = 'Low';

    await issue.save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 5 } });

    res.json({
      success: true,
      message: 'Thank you for upvoting!',
      complaintCount: issue.complaintCount,
      priority: issue.priority,
      upvotes: issue.votes.affected
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============== CREATE COMPLAINT ==============
router.post('/', auth, async (req, res) => {
  try {
    const complaint = new Complaint({
      ...req.body,
      userId: req.user.id
    });
    await complaint.save();

    const ward = complaint.location?.ward;
    if (ward) {
      const departmentMap = {
        Roads: 'Public Works',
        Sanitation: 'Sanitation Department',
        Water: 'Water Board',
        Electricity: 'Electricity Board',
        Other: 'General'
      };

      let issue = await Issue.findOne({
        category: complaint.category,
        ward,
        status: { $nin: ['Resolved', 'Verified', 'Rejected'] }
      });

      if (issue) {
        issue.complaintIds.push(complaint._id);
        issue.complaintCount = issue.complaintIds.length;
        issue.description = issue.description || complaint.description;
        issue.votes.affected = Math.max(issue.votes.affected || 0, issue.complaintCount);
        if (issue.complaintCount >= 10) issue.priority = 'High';
        else if (issue.complaintCount >= 5) issue.priority = 'Medium';
        else issue.priority = 'Low';
        await issue.save();
      } else {
        issue = new Issue({
          issueTitle: complaint.title,
          description: complaint.description,
          category: complaint.category,
          ward,
          location: {
            address: complaint.location?.address || '',
            lat: complaint.location?.lat || 0,
            lng: complaint.location?.lng || 0
          },
          priority: complaint.severity === 'critical' || complaint.severity === 'high' ? 'High' : 'Low',
          status: 'Pending',
          complaintCount: 1,
          initialComplaintCount: 1,
          complaintIds: [complaint._id],
          assignedDepartment: departmentMap[complaint.category] || 'General'
        });
        await issue.save();
      }

      complaint.issueId = issue._id;
      await complaint.save();
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });
    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============== GET COMPLAINTS ==============
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query.userId = req.user.id;
    } else if (req.user.role === 'authority' && req.user.ward) {
      query['location.ward'] = req.user.ward;
    }
    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============== GET SINGLE COMPLAINT ==============
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============== UPDATE COMPLAINT STATUS ==============
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'authority' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { status, resolutionProof } = req.body;
    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolutionProof = resolutionProof;
    }
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============== UPVOTE COMPLAINT ==============
router.post('/:id/upvote-complaint', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    const hasUpvoted = complaint.upvotes.includes(req.user.id);
    if (hasUpvoted) {
      complaint.upvotes = complaint.upvotes.filter(id => id.toString() !== req.user.id);
      complaint.upvoteCount--;
    } else {
      complaint.upvotes.push(req.user.id);
      complaint.upvoteCount++;
    }
    await complaint.save();
    res.json({ upvoteCount: complaint.upvoteCount, hasUpvoted: !hasUpvoted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============== DASHBOARD STATS ==============
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'authority' && req.user.ward) {
      query['location.ward'] = req.user.ward;
    }
    const total = await Complaint.countDocuments(query);
    const resolved = await Complaint.countDocuments({ ...query, status: 'resolved' });
    const pending = await Complaint.countDocuments({ ...query, status: 'pending' });
    const inProgress = await Complaint.countDocuments({ ...query, status: 'in-progress' });
    const overdue = await Complaint.countDocuments({ 
      ...query, 
      status: { $ne: 'resolved' },
      slaDeadline: { $lt: new Date() }
    });
    res.json({ total, resolved, pending, inProgress, overdue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
