const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
});

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['fixed', 'notFixed'] },
  timestamp: { type: Date, default: Date.now }
});

const issueSchema = new mongoose.Schema({
  issueTitle: { type: String, required: true },
  category: { type: String, enum: ['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'], required: true },
  ward: { type: String, required: true, index: true },
  location: { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 }, address: { type: String, default: '' } },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Low', index: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Pending Verification', 'Verified', 'Rejected'], default: 'Pending', index: true },
  complaintCount: { type: Number, default: 1 },
  initialComplaintCount: { type: Number, default: 1 },
  complaintIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
  assignedDepartment: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timeline: [timelineSchema],
  slaDeadline: { type: Date, default: () => new Date(+new Date() + 48*60*60*1000) },
  isOverdue: { type: Boolean, default: false },
  votes: { affected: { type: Number, default: 0 }, fixed: { type: Number, default: 0 }, notFixed: { type: Number, default: 0 } },
  images: [{ type: { type: String }, url: { type: String }, date: { type: Date, default: Date.now } }],
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  impactMetrics: {
    reduction: { type: Number, default: 0 },
    improvementPercentage: { type: Number, default: 0 },
    peakComplaintCount: { type: Number, default: 1 },
    resolutionTime: { type: Number, default: 0 },
    communityTrustScore: { type: Number, default: 0 }
  }
});

issueSchema.virtual('verifiedCount').get(function() {
  return this.votes?.fixed || 0;
});

issueSchema.virtual('notFixedCount').get(function() {
  return this.votes?.notFixed || 0;
});

issueSchema.methods.calculateVerificationPercentage = function() {
  const fixed = this.votes?.fixed || 0;
  const notFixed = this.votes?.notFixed || 0;
  const totalVotes = fixed + notFixed;
  return {
    totalVotes,
    fixedPercentage: totalVotes > 0 ? (fixed / totalVotes) * 100 : 0,
    notFixedPercentage: totalVotes > 0 ? (notFixed / totalVotes) * 100 : 0
  };
};

issueSchema.methods.updateVerificationStatus = function() {
  const stats = this.calculateVerificationPercentage();
  if (stats.totalVotes >= 3 && stats.fixedPercentage >= 70) {
    this.status = 'Verified';
    return 'verified';
  }
  if (stats.totalVotes >= 3 && stats.notFixedPercentage > 50) {
    this.status = 'In Progress';
    return 'rejected';
  }
  return 'pending';
};

issueSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const lastTimeline = this.timeline[this.timeline.length - 1];
    if (!lastTimeline || lastTimeline.status !== this.status) {
      this.timeline.push({ status: this.status, timestamp: new Date() });
    }
  }
  if (this.slaDeadline && new Date() > this.slaDeadline && !['Resolved', 'Verified'].includes(this.status)) {
    this.isOverdue = true;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
