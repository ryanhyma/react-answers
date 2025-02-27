import { getApiUrl } from '../utils/apiToUrl';

class LoggingService {
    static currentChatId = null;

    static setCurrentChatId(chatId) {
        LoggingService.currentChatId = chatId;
    }

    static async saveLog(level, message, metadata = null) {
        try {
            const response = await fetch(getApiUrl('logs'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: LoggingService.currentChatId,
                    logLevel: level,
                    message: typeof message === 'object' ? JSON.stringify(message) : message,
                    metadata
                })
            });

            if (!response.ok) {
                console.error('Failed to save log:', await response.text());
            }
        } catch (error) {
            console.error('Error saving log:', error);
        }
    }

    static async info(...args) {
        await LoggingService.saveLog('info', ...args);
    }

    static async warn(...args) {
        await LoggingService.saveLog('warn', ...args);
    }

    static async error(...args) {
        await LoggingService.saveLog('error', ...args);
    }

    static async debug(...args) {
        await LoggingService.saveLog('debug', ...args);
    }
}

export default LoggingService;