import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
    aiCitationUrl: { type: String, required: false },
    providedCitationUrl: { type: String, required: false },
    citationHead: { type: String, required: false },
    citationConfidence: { type: String, required: false },
});

export default mongoose.model('Citation', citationSchema);