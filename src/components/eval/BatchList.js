import React, { useEffect, useState } from 'react';
import { GcdsGrid, GcdsGridCol, GcdsButton } from '@cdssnc/gcds-components-react';
import getApiUrl from '../../utils/apiToUrl.js';

const BatchList = ({ buttonLabel, buttonAction, batchStatus }) => {
    const [batches, setBatches] = useState([]);

    const fetchStatus = async (batchId, provider) => {
        try {
            const response = await fetch(getApiUrl(`batch-status?batchId=${batchId}&provider=${provider}`));
            const data = await response.json();
            return { batchId, status: data.status };
        } catch (error) {
            console.error(`Error fetching status for batch ${batchId}:`, error);
            return { batchId, status: 'Error' };
        }
    };

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const statusPromises = batches.map(batch => fetchStatus(batch.batchId, batch.provider));
                const statusResults = await Promise.all(statusPromises);
                const updatedBatches = batches.map(batch => {
                    const statusResult = statusResults.find(status => status.batchId === batch.batchId);
                    return { ...batch, status: statusResult ? statusResult.status : 'Unknown' };
                });
                setBatches(updatedBatches);
            } catch (error) {
                console.error('Error fetching statuses:', error);
            }
        };

        fetchStatuses();
        const intervalId = setInterval(fetchStatuses, 30000); // Poll every 10 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);

    }, []);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const response = await fetch(getApiUrl('batch-list'));
                const data = await response.json();
                setBatches(data);
            } catch (error) {
                console.error('Error fetching batches:', error);
            }
        };

        fetchBatches();

        const intervalId = setInterval(fetchBatches, 30000); // Poll every 10 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);



    return (
        <GcdsGrid align-content="center" align-items="center" equal-row-height columnsDesktop="1fr 1fr 1fr 1fr 1fr 1fr" tag='div'>
            <p><strong>Batch ID</strong></p>
            <p><strong>Created Date</strong></p>
            <p><strong>Provider</strong></p>
            <p><strong>Type</strong></p>
            <p><strong>Status</strong></p>
            <p><strong>Actions</strong></p>
            {batches
                .filter(batch => batch.status === batchStatus)
                .map(batch => (
                    <React.Fragment key={batch._id}>
                        <p>{batch.batchId}</p>
                        <p>{batch.createdAt}</p>
                        <p>{batch.provider}</p>
                        <p>{batch.type}</p>
                        <p>{batch.status}</p>
                        <p>
                            <GcdsButton onClick={() => buttonAction(batch.batchId)}>{buttonLabel}</GcdsButton>
                        </p>
                    </React.Fragment>
                ))}
        </GcdsGrid>
    );
};

const handleAction = (batchId) => {
    console.log('Action clicked for batch:', batchId);
    // Implement your action logic here
};

export default BatchList;