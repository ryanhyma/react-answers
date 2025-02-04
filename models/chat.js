import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    interactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interaction',
        default: []
    }],
    aiProvider: { type: String, required: false, default: null },
    searchProvider: { type: String, required: false, default: null },
    referringUrl: { type: String, required: false, default: null },
    pageLanguage: { type: String, required: false, default: null },
},{
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            // Ensure all fields exist in output
            ret.aiProvider = ret.aiProvider || null;
            ret.searchProvider = ret.searchProvider || null;
            ret.referringUrl = ret.referringUrl || null;
            ret.pageLanguage = ret.pageLanguage || null;
        }
    }
});

export const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);