import mongoose from 'mongoose';
const { Schema } = mongoose;

const expertFeedbackSchema = new Schema({
    totalScore: Number,
    sentence1Score: Number,
    sentence2Score: Number,
    sentence3Score: Number,
    sentence4Score: Number,
    citationScore: Number,
    answerImprovement: String,
    expertCitationUrl: String
});

module.exports = mongoose.model('ExpertFeedback', expertFeedbackSchema);