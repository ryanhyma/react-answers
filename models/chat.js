import mongoose from 'mongoose.js';

const ChatSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    interactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatInteraction'
    }],
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;