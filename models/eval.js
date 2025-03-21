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
    }
}, { 
    timestamps: true, 
    versionKey: false,
    id: false
});

export const Eval = mongoose.models.Eval || mongoose.model('Eval', evalSchema);