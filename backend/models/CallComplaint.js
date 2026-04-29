const mongoose = require('mongoose');

const callComplaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'],
    default: 'Other'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  callerName: { type: String, default: '' },
  callerPhone: { type: String, default: '' },
  callerEmail: { type: String, default: '' },
  location: {
    address: { type: String, default: '' },
    ward: { type: String, default: '' }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vapiCallId: { type: String, default: '' },
  transcript: { type: String, default: '' },
  rawPayload: { type: Object, default: {} },
  source: { type: String, default: 'vapi-call' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

callComplaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('CallComplaint', callComplaintSchema);
