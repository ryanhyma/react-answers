import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  englishAnswer: { type: String, required: false },
  translatedAnswer: { type: String, required: false },
  citation: { type: mongoose.Schema.Types.ObjectId, ref: 'Citation' },
  inputTokens: { type: String, required: false },
  outputTokens: { type: String, required: false },
  cachedCreationInputTokens: { type: String, required: false },
  cachedReadInputTokens: { type: String, required: false },
  
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;