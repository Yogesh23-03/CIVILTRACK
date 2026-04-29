const { sendComplaintNotificationEmail } = require('../services/emailService'); 
// Create complaint with duplicate detection
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, location, severity, imageUrl } = req.body;
    
    // ... all your existing duplicate detection code ...
    // ... matchedIssue logic, createIssue logic ...

    // Create the complaint
    const complaint = new Complaint({
      title,
      description,
      category,
      location,
      userId: req.user.id,
      severity,
      imageUrl,
      issueId
    });
    
    await complaint.save();
    
    // Add complaint to issue's complaintIds array
    await Issue.findByIdAndUpdate(issueId, {
      $push: { complaintIds: complaint._id }
    });
    
    // Award points to user
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });

    // ✅ ADD THIS BLOCK HERE — after saving, before responding
    const { sendComplaintNotificationEmail } = require('../services/emailService');
    const authority = await User.findOne({ 
      role: 'authority', 
      ward: location.ward 
    });
    if (authority) {
      await sendComplaintNotificationEmail(
        authority.email,
        authority.name,
        { title, description, category, location, severity }
      );
    }
    // ✅ END OF NEW BLOCK

    res.status(201).json({
      complaint,
      issueId,
      isDuplicate: !!matchedIssue,
      message: matchedIssue 
        ? 'Complaint added to existing issue'
        : 'New issue created'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});