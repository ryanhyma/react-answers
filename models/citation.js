import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
    ai_citation_url: { type: String, required: false },
    provided_citation_url: { type: String, required: false },
    citation_head: { type: String, required: false },
    citation_confidence: { type: String, required: false },
});

export default mongoose.model('Citation', citationSchema);