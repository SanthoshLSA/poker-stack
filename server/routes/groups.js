const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const PlayerResult = require('../models/PlayerResult');
const { nanoid } = require('nanoid');

// @route POST /api/groups
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Group name must be at least 2 characters' });
    }

    let inviteCode;
    let exists = true;
    while (exists) {
      inviteCode = nanoid(6).toUpperCase();
      exists = await Group.findOne({ inviteCode });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim(),
      inviteCode,
      creator: req.user._id,
      members: [req.user._id]
    });

    await group.populate('creator', 'username avatarColor');
    res.status(201).json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating group' });
  }
});

// @route GET /api/groups/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('creator', 'username avatarColor')
      .populate('members', 'username avatarColor')
      .sort({ createdAt: -1 });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/groups/join
router.post('/join', protect, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
    if (!group) {
      return res.status(404).json({ error: 'Invalid invite code. No group found.' });
    }

    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }

    group.members.push(req.user._id);
    await group.save();
    await group.populate('creator', 'username avatarColor');
    await group.populate('members', 'username avatarColor');
    res.json({ group, message: `Joined "${group.name}" successfully!` });
  } catch (err) {
    res.status(500).json({ error: 'Server error joining group' });
  }
});

// @route GET /api/groups/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'username avatarColor')
      .populate('members', 'username avatarColor totalProfit sessionsPlayed isPrivate');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/groups/:id/leaderboard
router.get('/:id/leaderboard', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', '_id username');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const memberIds = group.members.map(m => m._id);

    // Aggregate stats per user from PlayerResults in this group
    const stats = await PlayerResult.aggregate([
      { $match: { group: group._id, user: { $in: memberIds } } },
      {
        $group: {
          _id: '$user',
          username: { $first: '$username' },
          totalProfit: { $sum: '$profit' },
          sessionsPlayed: { $sum: 1 },
          sessionsWon: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
          totalBuyIn: { $sum: '$buyIn' },
          totalCashOut: { $sum: '$cashOut' }
        }
      },
      { $sort: { totalProfit: -1 } }
    ]);

    // Enrich with privacy info
    const users = await User.find({ _id: { $in: memberIds } }).select('_id isPrivate avatarColor');
    const privacyMap = {};
    users.forEach(u => { privacyMap[u._id.toString()] = { isPrivate: u.isPrivate, avatarColor: u.avatarColor }; });

    const leaderboard = stats.map((s, i) => {
      const priv = privacyMap[s._id.toString()] || {};
      return {
        rank: i + 1,
        userId: s._id,
        username: s.username,
        avatarColor: priv.avatarColor,
        totalProfit: priv.isPrivate && s._id.toString() !== req.user._id.toString() ? null : s.totalProfit,
        sessionsPlayed: s.sessionsPlayed,
        sessionsWon: s.sessionsWon,
        isPrivate: priv.isPrivate
      };
    });

    res.json({ leaderboard, groupName: group.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route DELETE /api/groups/:id/leave
router.delete('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Creator cannot leave the group. Delete it instead.' });
    }
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
