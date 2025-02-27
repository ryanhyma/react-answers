import React, { useState, useEffect } from 'react';
import { GcdsButton, GcdsSelect, GcdsCheckbox } from '@cdssnc/gcds-components-react';
import DatabaseLoggingService from '../../services/DatabaseLoggingService';

const DatabaseLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('1');
    const [logLevel, setLogLevel] = useState('all');

    useEffect(() => {
        // Subscribe to real-time log updates
        const unsubscribe = DatabaseLoggingService.subscribe((logEntry) => {
            setLogs(prevLogs => [...prevLogs, logEntry]);
        });

        return () => unsubscribe();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await DatabaseLoggingService.getLogs({
                days: timeRange,
                level: logLevel !== 'all' ? logLevel : undefined
            });
            setLogs(response.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
        setLoading(false);
    };

    const handleDebugModeChange = (event) => {
        const enabled = event.target.checked;
        setIsDebugMode(enabled);
        DatabaseLoggingService.setDebugMode(enabled);
        if (!enabled) {
            setLogs([]); // Clear logs when disabling
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const getLogLevelColor = (level) => {
        switch (level) {
            case 'error': return 'text-red-500';
            case 'warn': return 'text-yellow-500';
            case 'debug': return 'text-blue-500';
            default: return 'text-green-500';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
                <GcdsSelect
                    id="timeRange"
                    label="Time range"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="1">Last 1 day</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                </GcdsSelect>

                <GcdsSelect
                    id="logLevel"
                    label="Log level"
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                >
                    <option value="all">All levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                </GcdsSelect>

                <GcdsCheckbox
                    checked={isDebugMode}
                    onChange={handleDebugModeChange}
                    label="Enable Debug Mode"
                />

                <GcdsButton
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Get logs'}
                </GcdsButton>

                {logs.length > 0 && (
                    <GcdsButton
                        onClick={clearLogs}
                        variant="secondary"
                    >
                        Clear logs
                    </GcdsButton>
                )}
            </div>

            <div className="bg-gray-900 text-white p-4 rounded-lg h-96 overflow-auto font-mono text-sm">
                {logs.length > 0 ? (
                    logs.map((log, index) => (
                        <div key={index} className="mb-2">
                            <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>{' '}
                            <span className={getLogLevelColor(log.logLevel)}>[{log.logLevel}]</span>{' '}
                            {log.chatId && <span className="text-purple-400">[Chat: {log.chatId}]</span>}{' '}
                            <span className="text-white">{log.message}</span>
                            {log.metadata && (
                                <pre className="text-gray-400 ml-8 mt-1">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-400">
                        {isDebugMode ? 'Waiting for logs...' : 'Select options and click "Get logs" to view database logs'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseLogs;