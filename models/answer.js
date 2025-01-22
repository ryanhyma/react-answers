import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
    englishAnswer: String,
  answer: String,
    input_tokens: { type: String, required: false },
    output_tokens: { type: String, required: false },
    cached_creation_input_tokens: { type: String, required: false },
    cached_read_input_tokens: { type: String, required: false },
    citation: { type: mongoose.Schema.Types.ObjectId, ref: 'Citation' }
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;