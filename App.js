const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  promptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prompt', required: true },
  name: { type: String, required: true },
  scaffoldHtml: { type: String, default: '' },
  scaffoldCss: { type: String, default: '' },
  scaffoldJs: { type: String, default: '' },
  trustScore: { type: Number, min: 0, max: 100, default: null },
  trustDimensions: {
    clarity: Number,
    logic: Number,
    uiConsistency: Number,
    reliability: Number,
  },
  status: {
    type: String,
    enum: ['draft', 'validated', 'deployed', 'archived', 'testing'],
    default: 'draft',
  },
  validationNotes: [String],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

appSchema.pre('save', function setUpdated(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('App', appSchema);
