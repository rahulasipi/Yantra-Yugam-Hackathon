const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['first_deploy', 'speedy_creator', 'innovator', 'logic_master', 'early_architect'],
    },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: 'Creator' },
  badges: [badgeSchema],
  xp: { type: Number, default: 0 },
  generationTimestamps: [{ type: Date }],
  deployCount: { type: Number, default: 0 },
  highTrustAppCount: { type: Number, default: 0 },
  pinnedApps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'App' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
