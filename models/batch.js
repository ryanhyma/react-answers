import mongoose from 'mongoose';

const EntrySchema = new mongoose.Schema({
  entry_id: { type: String, required: true },
  context_model: { type: String, required: false },
  answer_model: { type: String, required: false },
  
  redactedQuestion: { type: String, required: true },
  question: { type: String, required: true },
  referringUrl: { type: String, required: false },
  englishAnswer: { type: String, required: false },
  answer: { type: String, required: false },
  answer_citation_url: { type: String, required: false },
  
  answer_citation_head: { type: String, required: false },
  answer_citation_confidence: { type: String, required: false },
  
  context {
    
  }
  context_topic: { type: String, required: false },
  context_topicUrl: { type: String, required: false },
  context_department: { type: String, required: false },
  context_departmentUrl: { type: String, required: false },
  context_searchResults: { type: String, required: false },
  context_input_tokens: { type: String, required: false },
  context_output_tokens: { type: String, required: false },
  context_cached_creation_input_tokens: { type: String, required: false },
  context_cached_read_input_tokens: { type: String, required: false },
  
  answer_input_tokens: { type: String, required: false },
  answer_output_tokens: { type: String, required: false },
  answer_cached_creation_input_tokens: { type: String, required: false },
  answer_cached_read_input_tokens: { type: String, required: false }

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
