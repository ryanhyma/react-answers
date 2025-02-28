import React, { useState } from 'react';
import { GcdsButton } from '@cdssnc/gcds-components-react';
import { useTranslations } from '../../hooks/useTranslations.js';
import AdminCodeInput from './AdminCodeInput.js';
import $ from 'jquery';

const DatabaseLogs = ({ logs, chatId, onStartLogging, onChatIdChange }) => {
    const [adminCode, setAdminCode] = useState('');
    const [isLogging, setIsLogging] = useState(false);
    const correctAdminCode = '2024';
    const { t } = useTranslations();
    const tableRef = React.useRef(null);

    React.useEffect(() => {
        if (logs?.length > 0 && tableRef.current) {
            const table = $(tableRef.current).DataTable({
                data: logs,
                columns: [
                    { 
                        title: 'Created At', 
                        data: 'createdAt',
                        render: data => {
                            const date = new Date(data);
                            return date.toLocaleString();
                        }
                    },
                    { title: 'Level', data: 'logLevel' },
                    { title: 'Message', data: 'message' },
                    { title: 'Metadata', data: 'metadata', render: data => JSON.stringify(data).replaceAll("\\n","<br/>") }
                ],
                order: [[0, 'desc']],
                destroy: true
            });

            return () => {
                table.destroy();
            };
        }
    }, [logs]);

    const handleAdminCodeChange = (e) => {
        setAdminCode(e.target.value);
    };

    const handleStartPause = () => {
        setIsLogging(!isLogging);
        onStartLogging(!isLogging);
    };

    const handleRefreshChatId = () => {
        const storedChatId = localStorage.getItem('chatId');
        if (storedChatId && typeof onChatIdChange === 'function') {
            onChatIdChange(storedChatId);
            // Always trigger a refresh of logs regardless of current logging state
            onStartLogging(false);
            onStartLogging(true);
        }
    };

    const canStartLogging = adminCode === correctAdminCode && chatId;

    return (
        <div className="space-y-6">
               <GcdsButton
                    type="button"
                    onClick={handleRefreshChatId}
                    className="mt-4"
                >
                    Refresh Chat ID
                </GcdsButton>
            <div className="flex items-center gap-4">
                <AdminCodeInput
                    code={adminCode}
                    onChange={handleAdminCodeChange}
                    correctCode={correctAdminCode}
                    label="Enter Admin Code to view database logs:"
                />
             
            </div>

            {adminCode === correctAdminCode && (
                <div className="flex gap-4 items-center">
                    <GcdsButton
                        type="button"
                        disabled={!canStartLogging}
                        onClick={handleStartPause}
                    >
                        {isLogging ? t('logging.pause') : t('logging.start')}
                    </GcdsButton>
                </div>
            )}

            {canStartLogging && logs && (
                <div className="bg-white shadow rounded-lg">
                    {logs?.length > 0 ? (
                        <div className="p-4">
                            <table ref={tableRef} className="display">
                                <thead>
                                    <tr>
                                        <th>Created At</th>
                                        <th>Level</th>
                                        <th>Message</th>
                                        <th>Metadata</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4">
                            <p className="text-gray-500">No logs available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DatabaseLogs;