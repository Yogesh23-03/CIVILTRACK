const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.services');
const auth = require('../middleware/auth');

const isCivicTrackAdminEmail = (email = '') => email.toLowerCase().endsWith('@civictrack.com');

const getEffectiveRole = (user) => (
  user.role === 'admin' || isCivicTrackAdminEmail(user.email) ? 'admin' : user.role
);

const buildAuthResponse = (user) => {
  const role = getEffectiveRole(user);
  const token = jwt.sign(
    { id: user._id, email: user.email, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role,
      ward: user.ward,
      points: user.points
    }
  };
};

router.post('/register', async (req, res) => {
  try {
    const { name, password, role, ward } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    const effectiveRole = isCivicTrackAdminEmail(email) ? 'admin' : role;
    user = new User({ name, email, password, role: effectiveRole, ward });
    await user.save();
    res.json(buildAuthResponse(user));
    await emailService.sendRegistrationEmail(user.email, user.name);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    if (isCivicTrackAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    res.json(buildAuthResponse(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { name, googleId } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !googleId) {
      return res.status(400).json({ message: 'Google account details are required' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        password: `google_${googleId}`,
        role: isCivicTrackAdminEmail(email) ? 'admin' : 'citizen'
      });
      await user.save();
      emailService.sendRegistrationEmail(user.email, user.name).catch(() => {});
    } else if (isCivicTrackAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json(buildAuthResponse(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isCivicTrackAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json(buildAuthResponse(user).user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
