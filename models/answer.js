import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  englishAnswer: { type: String, required: false },
  content: { type: String, required: false },
  sentences: [{ type: String, required: false }],
  citation: { type: mongoose.Schema.Types.ObjectId, ref: 'Citation' },
  inputTokens: { type: String, required: false },
  outputTokens: { type: String, required: false },
  model: { type: String, required: false },
  answerType: { type: String, required: false },
},{
  timestamps: true, versionKey: false,
  id: false,
});

export const Answer = mongoose.models.Answer || mongoose.model('Answer', answerSchema);
