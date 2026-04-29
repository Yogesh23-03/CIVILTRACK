const router = require('express').Router();
const CallComplaint = require('../models/CallComplaint');
const User = require('../models/User');
const auth = require('../middleware/auth');

const categories = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'];
const severities = ['low', 'medium', 'high', 'critical'];

const normalizeCategory = (category = 'Other') => {
  const match = categories.find(item => item.toLowerCase() === String(category).toLowerCase());
  return match || 'Other';
};

const normalizeSeverity = (severity = 'medium') => {
  const match = severities.find(item => item === String(severity).toLowerCase());
  return match || 'medium';
};

const parseArguments = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const firstToolCallArgs = (payload) => {
  const toolCalls =
    payload?.message?.toolCalls ||
    payload?.toolCalls ||
    payload?.message?.tool_calls ||
    payload?.tool_calls ||
    [];

  const first = toolCalls[0];
  return parseArguments(
    first?.function?.arguments ||
    first?.function?.argumentsJson ||
    first?.arguments ||
    first?.args
  );
};

const extractPayload = (payload) => {
  const toolArgs = firstToolCallArgs(payload);
  const direct = payload?.complaint || payload?.data || payload?.message?.analysis || payload;
  const merged = { ...direct, ...toolArgs };
  const call = payload?.call || payload?.message?.call || {};
  const customer = call?.customer || payload?.customer || {};

  return {
    title: merged.title || merged.complaintTitle || merged.issueTitle,
    description: merged.description || merged.details || merged.summary || payload?.message?.transcript,
    category: normalizeCategory(merged.category),
    severity: normalizeSeverity(merged.severity),
    callerName: merged.callerName || merged.name || customer.name || '',
    callerPhone: merged.callerPhone || merged.phone || customer.number || call?.phoneNumber || '',
    callerEmail: merged.callerEmail || merged.email || '',
    location: {
      address: merged.address || merged.location || '',
      ward: merged.ward || ''
    },
    vapiCallId: merged.vapiCallId || call.id || payload?.callId || '',
    transcript: merged.transcript || payload?.message?.transcript || payload?.transcript || ''
  };
};

const normalizeCallComplaint = (complaint) => ({
  id: complaint._id.toString(),
  _id: complaint._id.toString(),
  title: complaint.title,
  description: complaint.description,
  category: complaint.category,
  severity: complaint.severity,
  status: complaint.status,
  ward: complaint.location?.ward,
  location: complaint.location,
  callerName: complaint.callerName,
  callerPhone: complaint.callerPhone,
  callerEmail: complaint.callerEmail,
  userId: complaint.userId?.toString(),
  source: complaint.source,
  date: complaint.createdAt,
  createdAt: complaint.createdAt
});

router.post('/vapi-webhook', async (req, res) => {
  try {
    const data = extractPayload(req.body);

    if (!data.title || !data.description) {
      return res.status(400).json({
        message: 'Missing required call complaint fields: title and description'
      });
    }

    const user = data.callerEmail
      ? await User.findOne({ email: data.callerEmail })
      : null;

    const complaint = new CallComplaint({
      ...data,
      userId: user?._id || null,
      rawPayload: req.body
    });

    await complaint.save();

    if (req.io) {
      req.io.emit('call-complaint-created', normalizeCallComplaint(complaint));
    }

    res.status(201).json({
      success: true,
      complaint: normalizeCallComplaint(complaint)
    });
  } catch (err) {
    console.error('Call complaint webhook error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      const user = await User.findById(req.user.id).select('email');
      query = {
        $or: [
          { userId: req.user.id },
          ...(user?.email ? [{ callerEmail: user.email }] : [])
        ]
      };
    }

    const complaints = await CallComplaint.find(query).sort({ createdAt: -1 });
    res.json(complaints.map(normalizeCallComplaint));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.body;
    const complaint = await CallComplaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!complaint) return res.status(404).json({ message: 'Call complaint not found' });
    res.json({ success: true, complaint: normalizeCallComplaint(complaint) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
