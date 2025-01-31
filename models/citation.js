import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
    aiCitationUrl: { type: String, required: false },
    providedCitationUrl: { type: String, required: false },
    citationHead: { type: String, required: false },
    confidenceRating: { type: String, required: false },
},{
    timestamps: true, versionKey: false,
    id: false,
});

export const Citation = mongoose.models.Citation || mongoose.model('Citation', citationSchema);