const router = require('express').Router();
const Complaint = require('../models/Complaint');
const Issue = require('../models/Issue');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { detectDuplicate } = require('../services/aiDuplicateDetector');
const axios = require('axios');

const toRedditPost = (post) => ({
  id: `reddit_${post.id}`,
  title: post.title,
  content: post.selftext || post.url_overridden_by_dest || '',
  score: post.score || 0,
  numComments: post.num_comments || 0,
  num_comments: post.num_comments || 0,
  author: post.author || 'reddit_user',
  created: post.created_utc || Date.now() / 1000,
  url: `https://reddit.com${post.permalink}`,
  subreddit: post.subreddit,
  isEnglish: true,
  isCivic: true,
  source: 'reddit'
});

router.get('/reddit/hot', async (req, res) => {
  try {
    const subreddits = (req.query.subs || 'india,mumbai,delhi,bangalore,chennai,kolkata')
      .split(',')
      .map(sub => sub.trim())
      .filter(Boolean);
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
    const allPosts = [];

    for (const sub of subreddits) {
      try {
        const response = await axios.get(`https://www.reddit.com/r/${sub}/hot.json`, {
          params: { limit, raw_json: 1 },
          headers: { 'User-Agent': 'CivicTrack/1.0' },
          timeout: 12000
        });

        const posts = response.data?.data?.children || [];
        posts.forEach(item => {
          if (item?.data) allPosts.push(toRedditPost(item.data));
        });
      } catch (error) {
        console.error(`Reddit fetch failed for r/${sub}:`, error.response?.status || error.message);
      }
    }

    res.json(allPosts);
  } catch (err) {
    console.error('Reddit hot route failed:', err);
    res.status(500).json({ message: 'Failed to fetch Reddit posts' });
  }
});

router.get('/reddit/post', async (req, res) => {
  try {
    const redditUrl = new URL(req.query.url);
    if (!redditUrl.hostname.includes('reddit.com')) {
      return res.status(400).json({ message: 'Please provide a Reddit post URL' });
    }

    redditUrl.search = '';
    redditUrl.hash = '';
    const pathname = redditUrl.pathname.endsWith('/') ? redditUrl.pathname : `${redditUrl.pathname}/`;
    const jsonUrl = `https://www.reddit.com${pathname}.json`;
    const response = await axios.get(jsonUrl, {
      params: { raw_json: 1 },
      headers: { 'User-Agent': 'CivicTrack/1.0' },
      timeout: 12000
    });

    const post = response.data?.[0]?.data?.children?.[0]?.data;
    if (!post) return res.status(404).json({ message: 'Could not read this Reddit post' });

    res.json(toRedditPost(post));
  } catch (err) {
    console.error('Reddit post route failed:', err.response?.status || err.message);
    res.status(500).json({ message: 'Failed to fetch Reddit post' });
  }
});

// Import complaint from community source (Reddit)
router.post('/complaint', auth, async (req, res) => {
  try {
    const { 
      title, description, category, ward, 
      location, sourceUrl, sourceAuthor, sourceScore 
    } = req.body;

    const activeIssues = await Issue.find({
      category,
      ward,
      status: { $nin: ['Resolved', 'Verified', 'Rejected'] }
    }).limit(10);

    const duplicateResult = await detectDuplicate(
      { title, description, category, ward },
      activeIssues.map(issue => ({
        id: issue._id,
        title: issue.issueTitle,
        description: issue.description || '',
        category: issue.category,
        ward: issue.ward
      }))
    );

    const complaint = new Complaint({
      title,
      description,
      category,
      location: { ward, address: location },
      userId: req.user.id,
      status: 'pending',
      upvoteCount: sourceScore || 0,
      source: 'community',
      sourceUrl,
      sourceAuthor
    });

    await complaint.save();

    let issue = null;
    let isDuplicate = false;

    if (
      duplicateResult.isDuplicate &&
      duplicateResult.confidence >= 0.7 &&
      activeIssues[duplicateResult.matchedIndex]
    ) {
      issue = activeIssues[duplicateResult.matchedIndex];
      isDuplicate = true;
    } else {
      issue = await Issue.findOne({
        category,
        ward,
        status: { $nin: ['Resolved', 'Verified', 'Rejected'] }
      });
    }
    
    if (issue) {
      issue.complaintCount += 1;
      issue.complaintIds.push(complaint._id);
      issue.description = issue.description || description;
      issue.votes.affected = Math.max(issue.votes?.affected || 0, sourceScore || issue.complaintCount);
      
      // Update priority based on complaint count
      if (issue.complaintCount >= 10) issue.priority = 'High';
      else if (issue.complaintCount >= 5) issue.priority = 'Medium';
      else issue.priority = 'Low';
      
      await issue.save();
    } else {
      const departmentMap = {
        'Roads': 'Public Works',
        'Sanitation': 'Sanitation Department',
        'Water': 'Water Board',
        'Electricity': 'Electricity Board',
        'Other': 'General'
      };

      issue = new Issue({
        issueTitle: title,
        description,
        category,
        ward,
        priority: 'Low',
        status: 'Pending',
        complaintCount: 1,
        initialComplaintCount: 1,
        complaintIds: [complaint._id],
        location: { address: location || `Ward ${ward}` },
        votes: { affected: sourceScore || 1, fixed: 0, notFixed: 0 },
        assignedDepartment: departmentMap[category]
      });
      
      await issue.save();
    }

    complaint.issueId = issue._id;
    await complaint.save();

    // Award points to user
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });

    res.status(201).json({
      success: true,
      complaint,
      issue,
      isDuplicate,
      duplicate: isDuplicate ? {
        similarity: duplicateResult.confidence,
        reason: duplicateResult.reason,
        existingIssue: {
          id: issue._id,
          title: issue.issueTitle,
          complaintCount: issue.complaintCount,
          upvotes: issue.votes?.affected || 0,
          priority: issue.priority,
          category: issue.category,
          ward: issue.ward,
          status: issue.status
        }
      } : null,
      message: 'Complaint imported successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all imported complaints (for community feed)
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find({ source: 'community' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
