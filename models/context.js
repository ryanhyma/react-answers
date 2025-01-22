import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const contextSchema = new Schema({
    topic: { type: String, required: false },
    topicUrl: { type: String, required: false },
    department: { type: String, required: false },
    departmentUrl: { type: String, required: false },
    searchResults: { type: String, required: false },
    input_tokens: { type: String, required: false },
    output_tokens: { type: String, required: false },
    cached_creation_input_tokens: { type: String, required: false },
    cached_read_input_tokens: { type: String, required: false }
});

module.exports = mongoose.model('Context', contextSchema);