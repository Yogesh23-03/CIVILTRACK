import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VerificationCard from '../components/VerificationCard';
import BeforeAfterProof from '../components/BeforeAfterProof';
import './IssueDetail.css';

const IssueDetail = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    // Fetch issue details from localStorage or API
    const storedIssues = localStorage.getItem('civictrack_issues');
    if (storedIssues) {
      const issues = JSON.parse(storedIssues);
      const found = issues.find(i => i.id === id);
      setIssue(found);
    }
  }, [id]);

  if (!issue) return <div>Loading...</div>;

  return (
    <div className="issue-detail-page">
      <div className="issue-detail-container">
        {/* Issue Header */}
        <div className="issue-header">
          <h1>{issue.issueTitle}</h1>
          <div className="issue-meta">
            <span>Ward {issue.ward}</span>
            <span>{issue.category}</span>
            <span className={`priority ${issue.priority}`}>{issue.priority} Priority</span>
          </div>
        </div>

        {/* BEFORE/AFTER PROOF SECTION - Added here */}
        <BeforeAfterProof issue={issue} />

        {/* VERIFICATION CARD - Added here */}
        <VerificationCard issue={issue} />
      </div>
    </div>
  );
};

export default IssueDetail;