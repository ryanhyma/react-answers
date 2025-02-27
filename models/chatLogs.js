import mongoose from 'mongoose';

const chatLogsSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: false, // Optional since some logs might be system-wide
        index: true
    },
    logLevel: {
        type: String,
        required: true,
        enum: ['info', 'warn', 'error', 'debug'],
        index: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // For additional structured data
        required: false
    }
}, { timestamps: true }); // This adds createdAt and updatedAt fields automatically

// Add compound index for efficient querying using createdAt instead of timestamp
chatLogsSchema.index({ chatId: 1, createdAt: -1 });

export const ChatLogs = mongoose.models.ChatLogs || mongoose.model('ChatLogs', chatLogsSchema);