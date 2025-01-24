import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  redactedQuestion: { type: String, required: true },
});

export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);