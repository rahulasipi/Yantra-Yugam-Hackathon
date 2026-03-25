const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true },
  fields: [
    {
      label: String,
      fieldType: { type: String, enum: ['text', 'email', 'number', 'dropdown'] },
      options: [String],
    },
  ],
  refinedFromPromptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prompt', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prompt', promptSchema);
