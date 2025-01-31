import mongoose, { model } from 'mongoose';

const Schema = mongoose.Schema;

const contextSchema = new Schema({
    topic: { type: String, required: false },
    topicUrl: { type: String, required: false },
    department: { type: String, required: false },
    departmentUrl: { type: String, required: false },
    searchResults: { type: String, required: false },
    inputTokens: { type: String, required: false },
    outputTokens: { type: String, required: false },
    model: { type: String, required: false },
    searchProvider: { type: String, required: false },
},{
    timestamps: true, versionKey: false,
    id: false,
});

export const Context = mongoose.models.Context || mongoose.model('Context', contextSchema);