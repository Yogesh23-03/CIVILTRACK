import React from 'react';
import { TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';

const ImpactDisplay = ({ issue }) => {
  const totalComplaints = issue?.complaintCount || 0;
  const resolvedCount = issue?.resolvedCount || 0;
  const affectedCount = issue?.affectedCount || totalComplaints;
  
  return (
    <div className="impact-display">
      <div className="impact-title">📊 Real Impact</div>
      <div className="impact-stats">
        <div className="impact-stat">
          <Users size={14} />
          <div>
            <strong>{affectedCount}</strong>
            <span>Citizens affected</span>
          </div>
        </div>
        <div className="impact-stat">
          <CheckCircle size={14} />
          <div>
            <strong>{resolvedCount}</strong>
            <span>Confirmed resolved</span>
          </div>
        </div>
        <div className="impact-stat">
          <TrendingUp size={14} />
          <div>
            <strong>{totalComplaints}</strong>
            <span>Total reports</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDisplay;