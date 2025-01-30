import mongoose, { model } from 'mongoose';
const Schema = mongoose.Schema;

const expertFeedbackSchema = new Schema({
    totalScore: { type: Number, required: false },
    sentence1Score: { type: Number, required: false },
    sentence2Score: { type: Number, required: false },
    sentence3Score: { type: Number, required: false },
    sentence4Score: { type: Number, required: false },
    citationScore: { type: Number, required: false },
    answerImprovement: { type: String, required: false },
    expertCitationUrl: { type: String, required: false },
    feedback: { type: String, required: false }
},{
    timestamps: true, versionKey: false,
    id: false,
});
export const ExpertFeedback = mongoose.models.ExpertFeedback || mongoose.model('ExpertFeedback', expertFeedbackSchema);
