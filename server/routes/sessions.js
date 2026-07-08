const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');
const PlayerResult = require('../models/PlayerResult');
const Group = require('../models/Group');
const { nanoid } = require('nanoid');

// @route POST /api/sessions - Create session
router.post('/', protect, async (req, res) => {
  try {
    const { name, initialBank, groupId } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Session name must be at least 2 characters' });
    }
    if (!initialBank || initialBank < 1) {
      return res.status(400).json({ error: 'Initial bank must be at least ₹1' });
    }

    // Verify group membership if provided
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }
    }

    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = nanoid(6).toUpperCase();
      exists = await Session.findOne({ roomCode, status: 'active' });
    }

    const session = await Session.create({
      name: name.trim(),
      roomCode,
      admin: req.user._id,
      adminUsername: req.user.username,
      group: groupId || null,
      initialBank: Number(initialBank),
      currentBank: Number(initialBank),
      players: [{
        user: req.user._id,
        username: req.user.username,
        avatarColor: req.user.avatarColor,
        currentStack: 0,
        totalBuyIn: 0
      }]
    });

    if (groupId) {
      await Group.findByIdAndUpdate(groupId, { $inc: { totalSessions: 1 } });
    }

    res.status(201).json({ session });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error creating session' });
  }
});

// @route POST /api/sessions/join - Join session
router.post('/join', protect, async (req, res) => {
  try {
    const { roomCode } = req.body;
    if (!roomCode) return res.status(400).json({ error: 'Room code is required' });

    const session = await Session.findOne({ roomCode: roomCode.toUpperCase().trim(), status: 'active' });
    if (!session) return res.status(404).json({ error: 'Session not found or has ended' });

    const alreadyIn = session.players.some(p => p.user.toString() === req.user._id.toString());
    if (alreadyIn) {
      return res.json({ session, message: 'Already in session' });
    }

    session.players.push({
      user: req.user._id,
      username: req.user.username,
      avatarColor: req.user.avatarColor,
      currentStack: 0,
      totalBuyIn: 0
    });

    await session.save();
    res.json({ session, message: `Joined "${session.name}" successfully!` });
  } catch (err) {
    console.error('Join session error:', err);
    res.status(500).json({ error: 'Server error joining session' });
  }
});

// @route GET /api/sessions/my - Get user's sessions
router.get('/my', protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      'players.user': req.user._id
    })
      .select('name roomCode status admin adminUsername initialBank currentBank players startedAt endedAt group')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/sessions/:roomCode - Get session details
router.get('/:roomCode', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .populate('group', 'name');

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.players.some(p => p.user.toString() === req.user._id.toString());
    if (!isParticipant && session.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not part of this session' });
    }

    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/sessions/:roomCode/transaction - Record transaction (admin only)
router.post('/:roomCode/transaction', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'ended') return res.status(400).json({ error: 'Session has ended' });
    if (session.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the session admin can record transactions' });
    }

    const { type, fromType, fromUserId, toUserId, amount, note } = req.body;

    if (!['buyin', 'rebuy', 'player_transfer'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }
    if (!['bank', 'player'].includes(fromType)) {
      return res.status(400).json({ error: 'Invalid fromType' });
    }
    if (!toUserId || !amount || amount < 1) {
      return res.status(400).json({ error: 'Recipient and valid amount are required' });
    }

    const toPlayer = session.players.find(p => p.user.toString() === toUserId);
    if (!toPlayer) return res.status(400).json({ error: 'Recipient player not found in session' });

    const txAmount = Number(amount);
    const warnings = [];

    if (fromType === 'bank') {
      // From bank to player
      if (txAmount > session.currentBank) {
        warnings.push(`Bank only has ₹${session.currentBank} but transaction is ₹${txAmount}`);
      }
      session.currentBank -= txAmount;
      toPlayer.currentStack += txAmount;
      toPlayer.totalBuyIn += txAmount;

      session.transactions.push({
        type,
        fromType: 'bank',
        from: null,
        fromUsername: 'Bank',
        to: toPlayer.user,
        toUsername: toPlayer.username,
        amount: txAmount,
        note: note || ''
      });
    } else {
      // From player to player (transfer)
      if (!fromUserId) return res.status(400).json({ error: 'Source player is required for player transfer' });
      const fromPlayer = session.players.find(p => p.user.toString() === fromUserId);
      if (!fromPlayer) return res.status(400).json({ error: 'Source player not found in session' });
      if (fromPlayer.user.toString() === toPlayer.user.toString()) {
        return res.status(400).json({ error: 'Cannot transfer to the same player' });
      }

      if (txAmount > fromPlayer.currentStack) {
        warnings.push(`${fromPlayer.username} only has ₹${fromPlayer.currentStack} but transfer is ₹${txAmount}. Stack will go negative.`);
      }

      fromPlayer.currentStack -= txAmount;
      toPlayer.currentStack += txAmount;
      toPlayer.totalBuyIn += txAmount;

      session.transactions.push({
        type: 'player_transfer',
        fromType: 'player',
        from: fromPlayer.user,
        fromUsername: fromPlayer.username,
        to: toPlayer.user,
        toUsername: toPlayer.username,
        amount: txAmount,
        note: note || ''
      });
    }

    await session.save();

    const totalInPlay = session.players.reduce((s, p) => s + p.currentStack, 0) + session.currentBank;
    res.json({
      session,
      warnings,
      conservationCheck: {
        initialBank: session.initialBank,
        totalInPlay,
        isBalanced: Math.abs(totalInPlay - session.initialBank) < 0.01
      }
    });
  } catch (err) {
    console.error('Transaction error:', err);
    res.status(500).json({ error: 'Server error recording transaction' });
  }
});

// @route POST /api/sessions/:roomCode/end - End session (admin only)
router.post('/:roomCode/end', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'ended') return res.status(400).json({ error: 'Session already ended' });
    if (session.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the session admin can end the session' });
    }

    const { finalStacks } = req.body; // { userId: finalAmount }
    if (!finalStacks || typeof finalStacks !== 'object') {
      return res.status(400).json({ error: 'Final stacks are required' });
    }

    // Validate conservation
    const totalFinal = Object.values(finalStacks).reduce((s, v) => s + Number(v), 0) + (finalStacks._bank ? 0 : session.currentBank);
    
    session.status = 'ended';
    session.endedAt = new Date();

    const results = [];

    for (const player of session.players) {
      const userId = player.user.toString();
      const finalStack = finalStacks[userId] !== undefined
        ? Number(finalStacks[userId])
        : player.currentStack;

      player.finalStack = finalStack;
      const profit = finalStack - player.totalBuyIn;

      // Update user totals
      await User.findByIdAndUpdate(player.user, {
        $inc: {
          totalProfit: profit,
          sessionsPlayed: 1,
          sessionsWon: profit > 0 ? 1 : 0
        }
      });

      // Create PlayerResult record
      const result = await PlayerResult.create({
        user: player.user,
        username: player.username,
        session: session._id,
        sessionName: session.name,
        group: session.group,
        buyIn: player.totalBuyIn,
        cashOut: finalStack,
        profit
      });
      results.push(result);
    }

    await session.save();
    res.json({ session, results, message: 'Session ended successfully' });
  } catch (err) {
    console.error('End session error:', err);
    res.status(500).json({ error: 'Server error ending session' });
  }
});

// @route GET /api/sessions/:roomCode/history - Transaction history
router.get('/:roomCode/history', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const isParticipant = session.players.some(p => p.user.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ error: 'Not a session participant' });

    res.json({ transactions: session.transactions, sessionName: session.name });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
