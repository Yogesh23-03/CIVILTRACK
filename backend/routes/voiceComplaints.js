// ─────────────────────────────────────────────────────────────
//  routes/voiceComplaints.js
//
//  Dedicated route for voice-submitted complaints.
//  The frontend VoiceComplaintButton.jsx POSTs directly to
//  /api/complaints (your existing route) with source: 'voice'.
//
//  This file adds:
//   1. GET  /api/voice-complaints        — fetch only voice complaints
//   2. POST /api/voice-complaints/submit — alternate endpoint (optional)
//
//  You do NOT need to change your existing complaints.js at all.
//  Just add source: 'voice' filtering where needed.
// ─────────────────────────────────────────────────────────────

const router = require('express').Router();
const Complaint = require('../models/Complaint');
const Issue = require('../models/Issue');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendComplaintRaisedEmail } = require('../services/email.services');

// ─── Helper: build/update Issue from complaint (same logic as complaints.js) ───
async function linkToIssue(complaint) {
  const ward = complaint.location?.ward;
  if (!ward) return;

  const departmentMap = {
    Roads: 'Public Works',
    Sanitation: 'Sanitation Department',
    Water: 'Water Board',
    Electricity: 'Electricity Board',
    Other: 'General',
  };

  let issue = await Issue.findOne({
    category: complaint.category,
    ward,
    status: { $nin: ['Resolved', 'Verified', 'Rejected'] },
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
        address: complaint.location?.address || `Ward ${ward}`,
        lat: complaint.location?.lat || 0,
        lng: complaint.location?.lng || 0,
      },
      priority:
        complaint.severity === 'critical' || complaint.severity === 'high'
          ? 'High'
          : 'Low',
      status: 'Pending',
      complaintCount: 1,
      initialComplaintCount: 1,
      complaintIds: [complaint._id],
      assignedDepartment: departmentMap[complaint.category] || 'General',
    });
    await issue.save();
  }

  complaint.issueId = issue._id;
  await complaint.save();
}

// ─────────────────────────────────────────────────────────────
//  POST /api/voice-complaints/submit
//  Optional dedicated endpoint — the frontend can also just POST
//  to /api/complaints directly (both work identically).
// ─────────────────────────────────────────────────────────────
router.post('/submit', auth, async (req, res) => {
  try {
    const { title, description, category, location, severity } = req.body;

    // Basic validation
    if (!title || !description || !category || !location?.ward) {
      return res.status(400).json({
        message: 'title, description, category, and location.ward are required.',
      });
    }

    const complaint = new Complaint({
      title,
      description,
      category,
      location: {
        address: location.address || `Ward ${location.ward}`,
        ward: location.ward,
        lat: location.lat || 0,
        lng: location.lng || 0,
      },
      severity: severity || 'medium',
      status: 'pending',
      source: 'voice',          // ← marks this as a voice complaint
      userId: req.user.id,
    });

    await complaint.save();

    // Send confirmation email
    try {
      const user = await User.findById(req.user.id);
      if (user?.email) {
        await sendComplaintRaisedEmail(user.email, user.name, complaint);
      }
    } catch (emailErr) {
      console.error('Email error (non-fatal):', emailErr.message);
    }

    // Link to an Issue (same logic as complaints.js)
    await linkToIssue(complaint);

    // Award points
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });

    res.status(201).json({
      success: true,
      message: 'Voice complaint submitted successfully.',
      complaint,
    });
  } catch (err) {
    console.error('Voice complaint error:', err);
    res.status(500).json({ message: 'Server error submitting voice complaint.' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/voice-complaints
//  Returns only complaints submitted via voice (source: 'voice')
//  Used by ComplaintDashboard to show voice complaints separately
//  (replaces the broken fetchCallComplaints from VAPI).
// ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let query = { source: 'voice' };

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

module.exports = router;