import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  interactionId: {
    type: String,
    required: false,
    default: null
  },
  responseTime: {
    type: String,
    required: false,
    default: null
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer',
    default: null
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  expertFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertFeedback',
    default: null
  },
  context: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Context',
    default: null
  }
},{
  timestamps: true,
  versionKey: false,
  id: false,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Ensure all fields exist in output
      ret.interactionId = ret.interactionId || null;
      ret.responseTime = ret.responseTime || null;
      ret.answer = ret.answer || null;
      ret.question = ret.question || null;
      ret.expertFeedback = ret.expertFeedback || null;
      ret.context = ret.context || null;
    }
  }
});

export const Interaction = mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema);