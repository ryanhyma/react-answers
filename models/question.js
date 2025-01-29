import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  redactedQuestion: { type: String, required: true },
  language: { type: String, required: false },
}, {
  timestamps: true, versionKey: false,
  id: false,
});

export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);