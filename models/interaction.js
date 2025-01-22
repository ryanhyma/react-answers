import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  

  
  
 
  
  preliminaryChecks: String,
  aiResponse: String,
  
  originalCitationUrl: String,
  citationUrl: String,
  confidenceRating: String,
  feedback: String,
  expertFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertFeedback'
  }
}, { timestamps: true });

// Prevent model recompilation error in development
export const ChatInteraction = mongoose.models.Interaction || mongoose.model('sInteraction', InteractionSchema); 