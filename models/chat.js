import mongoose from 'mongoose.js';


const ChatSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    interactions: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Interaction'
    }],
    provider: { type: String, required: true },
    referringUrl: { type: String, required: false }

}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;