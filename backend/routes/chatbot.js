const router = require('express').Router();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const CallComplaint = require('../models/CallComplaint');
const auth = require('../middleware/auth');

const STATUS_WORDS = {
  resolved: ['resolved', 'solved', 'fixed', 'completed', 'done'],
  'in-progress': ['progress', 'working', 'assigned', 'started'],
  pending: ['pending', 'waiting', 'open', 'new'],
  rejected: ['rejected', 'declined', 'cancelled', 'canceled']
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeComplaint = (complaint, source) => {
  const object = complaint.toObject ? complaint.toObject() : complaint;
  return {
    id: object._id?.toString() || object.id,
    title: object.title,
    description: object.description,
    category: object.category,
    severity: object.severity,
    status: object.status,
    ward: object.location?.ward || '',
    address: object.location?.address || '',
    source,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt
  };
};

const detectStatus = (question) => {
  const lowerQuestion = question.toLowerCase();
  return Object.entries(STATUS_WORDS).find(([, words]) =>
    words.some((word) => lowerQuestion.includes(word))
  )?.[0];
};

const extractSearchText = (question) => {
  const cleaned = question
    .toLowerCase()
    .replace(/\b(what|which|where|is|are|the|my|complaint|complaints|status|present|been|has|have|it|show|tell|me|about|of|for)\b/g, ' ')
    .replace(/\b(resolved|solved|fixed|completed|done|pending|waiting|open|new|progress|working|assigned|started|rejected|declined|cancelled|canceled)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length >= 3 ? cleaned : '';
};

const buildBaseQuery = (req) => {
  if (req.user.role === 'admin') return {};
  if (req.user.role === 'authority' && req.user.ward) return { 'location.ward': req.user.ward };
  return { userId: req.user.id };
};

const buildCallBaseQuery = (req) => {
  if (req.user.role === 'admin') return {};
  if (req.user.role === 'authority' && req.user.ward) return { 'location.ward': req.user.ward };
  return {
    $or: [
      { userId: req.user.id },
      { callerEmail: req.user.email }
    ]
  };
};

const buildAnswer = (matches, question) => {
  if (matches.length === 0) {
    return "I couldn't find a matching complaint in your account. Try asking with the exact complaint title or ID.";
  }

  if (matches.length === 1) {
    const complaint = matches[0];
    const place = complaint.ward ? ` in ward ${complaint.ward}` : '';
    return `Your complaint "${complaint.title}"${place} is currently ${complaint.status}. Category: ${complaint.category}. Severity: ${complaint.severity}.`;
  }

  const status = detectStatus(question);
  const statusLine = status ? ` with status ${status}` : '';
  const preview = matches
    .slice(0, 5)
    .map((complaint, index) => `${index + 1}. ${complaint.title} - ${complaint.status}`)
    .join('\n');

  return `I found ${matches.length} complaint(s)${statusLine}:\n${preview}`;
};

router.post('/query', auth, async (req, res) => {
  try {
    const question = String(req.body.question || req.body.message || '').trim();
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const status = detectStatus(question);
    const searchText = extractSearchText(question);
    const idMatch = question.match(/[a-f\d]{24}/i);

    const complaintQuery = buildBaseQuery(req);
    const callComplaintQuery = buildCallBaseQuery(req);

    if (status) {
      complaintQuery.status = status;
      callComplaintQuery.status = status;
    }

    if (idMatch && mongoose.Types.ObjectId.isValid(idMatch[0])) {
      complaintQuery._id = idMatch[0];
      callComplaintQuery._id = idMatch[0];
    } else if (searchText) {
      const titleSearch = new RegExp(escapeRegex(searchText), 'i');
      complaintQuery.$and = [
        ...(complaintQuery.$and || []),
        { $or: [{ title: titleSearch }, { description: titleSearch }, { category: titleSearch }] }
      ];
      callComplaintQuery.$and = [
        ...(callComplaintQuery.$and || []),
        { $or: [{ title: titleSearch }, { description: titleSearch }, { category: titleSearch }] }
      ];
    }

    const [complaints, callComplaints] = await Promise.all([
      Complaint.find(complaintQuery).sort({ createdAt: -1 }).limit(10),
      CallComplaint.find(callComplaintQuery).sort({ createdAt: -1 }).limit(10)
    ]);

    const matches = [
      ...complaints.map((complaint) => normalizeComplaint(complaint, 'app')),
      ...callComplaints.map((complaint) => normalizeComplaint(complaint, 'call'))
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({
      answer: buildAnswer(matches, question),
      count: matches.length,
      complaints: matches
    });
  } catch (err) {
    console.error('Chatbot query error:', err);
    res.status(500).json({ message: 'Unable to answer complaint question right now' });
  }
});

module.exports = router;
