import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const evalSchema = new Schema({
    interaction: { 
        type: Schema.Types.ObjectId,
        ref: 'Interaction',
        required: true 
    },
    expertFeedback: { 
        type: Schema.Types.ObjectId, 
        ref: 'ExpertFeedback',
        required: false
    },
    similarityScore: {
        type: Number,
        required: false,
        default: 0
    },
    answerSimilarity: {
        type: Number,
        required: false,
        default: 0
    },
    sentenceSimilarity: {
        type: Number,
        required: false,
        default: 0
    },
    combinedSimilarity: {
        type: Number,
        required: false,
        default: 0
    },
    sentenceMatches: [{
        sourceIndex: { type: Number, required: true },  // Index of the sentence in the current answer
        mappedFeedbackIndex: { type: Number, required: true },  // Which expert feedback sentence this maps to (1-4)
        similarity: { type: Number, required: true },  // Similarity score for this sentence match
        score: { type: Number, required: false }  // Score from expert feedback for this sentence
    }]
}, { 
    timestamps: true, 
    versionKey: false,
    id: false
});

export const Eval = mongoose.models.Eval || mongoose.model('Eval', evalSchema);