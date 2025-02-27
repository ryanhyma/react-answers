import { ChatLogs } from '../models/chatLogs.js';
import dbConnect from '../api/db-connect.js';

const ServerLoggingService = {
    log: async (level, message, chatId = 'system', data = {}) => {
        console[level](`[${level.toUpperCase()}][${chatId}] ${message}`, data);
        
        try {
            await dbConnect();
            const log = new ChatLogs({
                chatId,
                logLevel: level,
                message: typeof message === 'object' ? JSON.stringify(message) : message,
                metadata: data
            });
            await log.save();
        } catch (error) {
            console.error('Failed to save log to database:', error);
        }
    },

    getLogs: async ({ days = 1, level = null, chatId = null, skip = 0, limit = 100 }) => {
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
    },

    info: async (message, chatId = 'system', data = {}) => {
        await ServerLoggingService.log('info', message, chatId, data);
    },

    debug: async (message, chatId = 'system', data = {}) => {
        await ServerLoggingService.log('debug', message, chatId, data);
    },

    warn: async (message, chatId = 'system', data = {}) => {
        await ServerLoggingService.log('warn', message, chatId, data);
    },

    error: async (message, chatId = 'system', error = null) => {
        const errorData = {
            error: error?.message || error,
            stack: error?.stack
        };
        await ServerLoggingService.log('error', message, chatId, errorData);
    }
};

export default ServerLoggingService;