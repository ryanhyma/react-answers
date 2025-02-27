import { ChatLogs } from '../models/chatLogs.js';
import dbConnect from '../api/db-connect.js';

class DatabaseLoggingService {
    static instance = null;

    static getInstance() {
        if (!DatabaseLoggingService.instance) {
            DatabaseLoggingService.instance = new DatabaseLoggingService();
        }
        return DatabaseLoggingService.instance;
    }

    async saveLog(level, chatId, message, metadata = null) {
        await dbConnect();

        const log = new ChatLogs({
            chatId,
            logLevel: level,
            message: typeof message === 'object' ? JSON.stringify(message) : message,
            metadata
        });

        await log.save();
        return log;
    }

    async getLogs({ days = 1, level = null, chatId = null, skip = 0, limit = 100 }) {
        await dbConnect();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const query = {
            timestamp: { $gte: startDate }
        };

        if (level && level !== 'all') {
            query.logLevel = level;
        }

        if (chatId) {
            query.chatId = chatId;
        }

        const logs = await ChatLogs.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await ChatLogs.countDocuments(query);
        const hasMore = total > skip + logs.length;

        return {
            logs,
            total,
            hasMore
        };
    }

    async info(chatId, message, metadata = null) {
        return this.saveLog('info', chatId, message, metadata);
    }

    async warn(chatId, message, metadata = null) {
        return this.saveLog('warn', chatId, message, metadata);
    }

    async error(chatId, message, metadata = null) {
        return this.saveLog('error', chatId, message, metadata);
    }

    async debug(chatId, message, metadata = null) {
        return this.saveLog('debug', chatId, message, metadata);
    }
}

export default DatabaseLoggingService;