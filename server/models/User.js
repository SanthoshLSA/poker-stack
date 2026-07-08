const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  avatarColor: {
    type: String,
    default: () => {
      const colors = ['#c9a84c', '#8b1c1c', '#1a6b3a', '#2d5a9e', '#7c3aed', '#c2410c'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  sessionsPlayed: {
    type: Number,
    default: 0
  },
  sessionsWon: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublicJSON = function() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    avatarColor: this.avatarColor,
    isPrivate: this.isPrivate,
    totalProfit: this.isPrivate ? null : this.totalProfit,
    sessionsPlayed: this.sessionsPlayed,
    sessionsWon: this.sessionsWon,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
