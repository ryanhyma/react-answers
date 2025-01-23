import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  redactedQuestion: { type: String, required: true },
});

export default mongoose.model('Question', questionSchema);