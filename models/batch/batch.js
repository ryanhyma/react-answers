import mongoose from 'mongoose';

const EntrySchema = new mongoose.Schema({
  entry_id: { type: String, required: true },
  question: { type: String, required: true },
  url: { type: String, required: false },
  topic: { type: String, required: false },
  topicUrl: { type: String, required: false },
  department: { type: String, required: false },
  departmentUrl: { type: String, required: false },
  searchResults: { type: String, required: false },
  context_model: { type: String, required: false },
  context_tokens: { type: String, required: false },
  answer: { type: String, required: false },
  answer_model: { type: String, required: false },
  answer_tokens: { type: String, required: false },
});

const BatchSchema = new mongoose.Schema({
  status: { type: String, required: false },
  batchId: { type: String, required: true },
  type: { type: String, required: true },
  provider: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  entries: [EntrySchema]
}, { timestamps: true });

// Prevent model recompilation error in development
export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
