import { getApiUrl } from '../utils/apiToUrl';

class DatabaseLoggingService {
    static instance = null;
    static subscribers = new Set();
    static debugMode = false;
    static currentChatId = null;

    static getInstance() {
        if (!DatabaseLoggingService.instance) {
            DatabaseLoggingService.instance = new DatabaseLoggingService();
        }
        return DatabaseLoggingService.instance;
    }

    static setCurrentChatId(chatId) {
        DatabaseLoggingService.currentChatId = chatId;
    }

    static setDebugMode(enabled) {
        DatabaseLoggingService.debugMode = enabled;
    }

    static subscribe(callback) {
        DatabaseLoggingService.subscribers.add(callback);
        return () => DatabaseLoggingService.subscribers.delete(callback);
    }

    static async saveLog(level, message, metadata = null) {
        // Always log to console first
        console[level](...[message, metadata].filter(Boolean));

        try {
            const response = await fetch(getApiUrl('db-save-log'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: DatabaseLoggingService.currentChatId,
                    logLevel: level,
                    message: typeof message === 'object' ? JSON.stringify(message) : message,
                    metadata: metadata
                })
            });

            if (!response.ok) {
                console.error('Failed to save log to database:', await response.text());
            }

            // Notify subscribers if in debug mode
            if (DatabaseLoggingService.debugMode) {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    level,
                    message: typeof message === 'object' ? JSON.stringify(message) : message,
                    metadata,
                    chatId: DatabaseLoggingService.currentChatId
                };
                DatabaseLoggingService.subscribers.forEach(callback => callback(logEntry));
            }
        } catch (error) {
            console.error('Error saving log to database:', error);
        }
    }

    static async info(...args) {
        await DatabaseLoggingService.saveLog('info', ...args);
    }

    static async warn(...args) {
        await DatabaseLoggingService.saveLog('warn', ...args);
    }

    static async error(...args) {
        await DatabaseLoggingService.saveLog('error', ...args);
    }

    static async debug(...args) {
        await DatabaseLoggingService.saveLog('debug', ...args);
    }

    static async getLogs(options = {}) {
        try {
            const queryParams = new URLSearchParams({
                ...(options.chatId && { chatId: options.chatId }),
                ...(options.level && { level: options.level }),
                ...(options.days && { days: options.days })
            }).toString();

            const response = await fetch(getApiUrl(`db-get-logs?${queryParams}`));
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    }
}

export default DatabaseLoggingService;