const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'], required: true },
  location: { address: String, ward: { type: String, required: true }, lat: Number, lng: Number },
  imageUrl: { type: String, default: null },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  source: { type: String, default: 'app' },
  sourceUrl: { type: String, default: '' },
  sourceAuthor: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
