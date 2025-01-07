import mongoose from 'mongoose';

const EntrySchema = new mongoose.Schema({
  question: { type: String, required: true },
  url: { type: String, required: true },
  context: { type: String, required: true },
  answer: { type: String, required: true }
});

const BatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  type: { type: String, required: true },
  provider: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  entries: [EntrySchema]
}, { timestamps: true });

// Prevent model recompilation error in development
export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
