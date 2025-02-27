import React, { useState } from 'react';
import { GcdsButton } from '@cdssnc/gcds-components-react';
import AdminCodeInput from './AdminCodeInput.js';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';

DataTable.use(DT);

const DatabaseLogs = ({ logs, chatId, onStartLogging }) => {
    const [adminCode, setAdminCode] = useState('');
    const correctAdminCode = '2024';

    const handleAdminCodeChange = (e) => {
        setAdminCode(e.target.value);
    };

    const canStartLogging = adminCode === correctAdminCode && chatId;

    return (
        <div className="space-y-6">
            <AdminCodeInput
                code={adminCode}
                onChange={handleAdminCodeChange}
                correctCode={correctAdminCode}
                label="Enter Admin Code to view database logs:"
            />

            {adminCode === correctAdminCode && (
                <GcdsButton
                    type="button"
                    disabled={!canStartLogging}
                    onClick={onStartLogging}
                >
                    Start Logging
                </GcdsButton>
            )}

            {canStartLogging && logs && (
                <div className="bg-white shadow rounded-lg">
                    {logs?.length > 0 ? (
                        <div className="p-4">
                            <DataTable
                                data={logs}
                                columns={[
                                    { title: 'Timestamp', data: 'timestamp' },
                                    { title: 'Level', data: 'level' },
                                    { title: 'Message', data: 'message' },
                                    { title: 'Metadata', data: 'metadata', render: data => JSON.stringify(data) }
                                ]}
                            />
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