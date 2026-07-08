const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const PlayerResult = require('../models/PlayerResult');

// @route GET /api/leaderboard - Global leaderboard
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({})
      .select('username avatarColor totalProfit sessionsPlayed sessionsWon isPrivate createdAt')
      .sort({ totalProfit: -1 })
      .limit(100);

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      userId: u._id,
      username: u.username,
      avatarColor: u.avatarColor,
      // Show own stats even if private, hide others'
      totalProfit: u.isPrivate && u._id.toString() !== req.user._id.toString()
        ? null
        : u.totalProfit,
      sessionsPlayed: u.sessionsPlayed,
      sessionsWon: u.sessionsWon,
      isPrivate: u.isPrivate,
      memberSince: u.createdAt
    }));

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/leaderboard/user/:id - Individual user stats
router.get('/user/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isOwnProfile = user._id.toString() === req.user._id.toString();

    const results = isOwnProfile || !user.isPrivate
      ? await PlayerResult.find({ user: user._id })
          .populate('session', 'name startedAt')
          .populate('group', 'name')
          .sort({ date: -1 })
          .limit(50)
      : [];

    res.json({
      user: user.toPublicJSON(),
      results: isOwnProfile || !user.isPrivate ? results : null,
      isPrivate: user.isPrivate
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
