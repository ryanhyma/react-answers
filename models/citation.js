import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
    aiCitationUrl: { type: String, required: false },
    providedCitationUrl: { type: String, required: false },
    citationHead: { type: String, required: false },
    onfidenceRating: { type: String, required: false },
});

export const Citation = mongoose.models.Citation || mongoose.model('Citation', citationSchema);