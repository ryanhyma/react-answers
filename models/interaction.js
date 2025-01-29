import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  interactionId: {
    type: String,
    required: false
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  expertFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertFeedback'
  },
  context: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Context'
  }
}, { timestamps: true });


export const Interaction = mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema);