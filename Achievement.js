const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  badgeType: {
    type: String,
    required: true,
    enum: ['first_deploy', 'speedy_creator', 'innovator', 'logic_master', 'early_architect'],
  },
  progress: { type: Number, default: 100 },
  unlockedAt: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
});

achievementSchema.index({ userId: 1, badgeType: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
