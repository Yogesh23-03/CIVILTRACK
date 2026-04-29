// Priority keywords for urgent detection
const urgentKeywords = [
  'emergency', 'urgent', 'critical', 'danger', 'accident',
  'collapse', 'break', 'burst', 'flood', 'fire',
  'immediate', 'asap', 'crisis', 'hazard', 'risk'
];

// Department mapping
const departmentMapping = {
  'Roads': 'Public Works',
  'Sanitation': 'Sanitation Department',
  'Water': 'Water Board',
  'Electricity': 'Electricity Board',
  'Other': 'General'
};

// Calculate priority based on complaint count and content
const calculatePriority = (complaintCount, title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  const hasUrgentKeyword = urgentKeywords.some(keyword => text.includes(keyword));
  
  if (complaintCount > 10 || hasUrgentKeyword) {
    return 'High';
  } else if (complaintCount >= 5) {
    return 'Medium';
  } else {
    return 'Low';
  }
};

// Extract keywords from complaint
const extractKeywords = (title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  const words = text.split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const keywords = [...new Set(words.filter(w => w.length > 3 && !stopWords.includes(w)))];
  return keywords.slice(0, 10);
};

// Calculate similarity score between two complaints
const calculateSimilarity = (complaint1, complaint2) => {
  if (complaint1.category !== complaint2.category) return 0;
  if (complaint1.location.ward !== complaint2.location.ward) return 0.3;
  
  const keywords1 = extractKeywords(complaint1.title, complaint1.description);
  const keywords2 = extractKeywords(complaint2.title, complaint2.description);
  
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  const similarity = commonKeywords.length / Math.max(keywords1.length, keywords2.length);
  
  return similarity;
};

// Get department for category
const getDepartment = (category) => {
  return departmentMapping[category] || 'General';
};

// Update impact metrics for an issue
const updateImpactMetrics = async (issue) => {
  const reduction = issue.initialComplaintCount - issue.complaintCount;
  const improvementPercentage = (reduction / issue.initialComplaintCount) * 100;
  
  let resolutionTime = 0;
  if (issue.resolvedAt) {
    resolutionTime = (issue.resolvedAt - issue.createdAt) / (1000 * 60 * 60);
  }
  
  issue.impactMetrics = {
    reduction: Math.max(0, reduction),
    improvementPercentage: Math.max(0, improvementPercentage),
    peakComplaintCount: Math.max(issue.impactMetrics?.peakComplaintCount || issue.complaintCount, issue.complaintCount),
    resolutionTime: resolutionTime
  };
  
  await issue.save();
  return issue.impactMetrics;
};

module.exports = {
  calculatePriority,
  extractKeywords,
  calculateSimilarity,
  getDepartment,
  updateImpactMetrics,
  urgentKeywords
};