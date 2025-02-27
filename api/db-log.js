import DatabaseLoggingService from '../services/DatabaseLoggingService.js';

export default async function handler(req, res) {
    const loggingService = DatabaseLoggingService.getInstance();

    if (req.method === 'GET') {
        const { days = 1, level, chatId, skip = '0', limit = '100' } = req.query;
        
        try {
            const result = await loggingService.getLogs({
                days: parseInt(days),
                level,
                chatId,
                skip: parseInt(skip),
                limit: parseInt(limit)
            });
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error fetching logs:', error);
            return res.status(500).json({ error: 'Failed to fetch logs' });
        }
    } else if (req.method === 'POST') {
        const { logLevel, chatId, message, metadata } = req.body;
        
        try {
            const log = await loggingService[logLevel](chatId, message, metadata);
            return res.status(200).json(log);
        } catch (error) {
            console.error('Error saving log:', error);
            return res.status(500).json({ error: 'Failed to save log' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}