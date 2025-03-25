import mongoose from 'mongoose';

const embeddingSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  interactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interaction', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  questionEmbedding: { type: [Number], required: false, index: true, sparse: true }, // Embedding for the question
  questionsEmbedding: { type: [Number], required: false, index: true, sparse: true }, // Embedding for questions up to this point Q1, Q2, Q3
  questionsAnswerEmbedding: { type: [Number], required: false, index: true, sparse: true }, // Combined embedding for question (Q1, Q2, Q3 and A3) and answer
  answerEmbedding: { type: [Number], required: false, index: true, sparse: true }, // Embedding for the answer
  sentenceEmbeddings: [{ type: [Number], required: false }], // Embeddings for individual sentences
}, {
  timestamps: true,
  versionKey: false,
  id: false,
});

export const Embedding = mongoose.models.Embedding || mongoose.model('Embedding', embeddingSchema);