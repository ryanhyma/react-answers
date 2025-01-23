import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  
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
  }
}, { timestamps: true });


export const Interaction = mongoose.models.Interaction  