import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const contextSchema = new Schema({
    topic: { type: String, required: false },
    topicUrl: { type: String, required: false },
    department: { type: String, required: false },
    departmentUrl: { type: String, required: false },
    searchResults: { type: String, required: false },
    inputTokens: { type: String, required: false },
    outputTokens: { type: String, required: false },
    cachedCreationInputTokens: { type: String, required: false },
    cachedReadInputTokens: { type: String, required: false }
});

module.exports = mongoose.model('Context', contextSchema);