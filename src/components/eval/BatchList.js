import React, { useEffect, useState } from 'react';
import { GcdsGrid, GcdsButton } from '@cdssnc/gcds-components-react';
import {getApiUrl,getProviderApiUrl} from '../../utils/apiToUrl.js';

const BatchList = ({ buttonLabel, buttonAction, batchStatus }) => {
    const [batches, setBatches] = useState([]);

    const fetchStatus = async (batchId, provider) => {
        try {
            const response = await fetch(getProviderApiUrl(provider,`batch-status?batchId=${batchId}`));
            const data = await response.json();
            return { batchId, status: data.status };
        } catch (error) {
            console.error(`Error fetching status for batch ${batchId}:`, error);
            return { batchId, status: 'Error' };
        }
    };

    const fetchStatuses = async (batches) => {
        try {
            const statusPromises = batches.map(batch => {
                if (!batch.status) {
                    return fetchStatus(batch.batchId, batch.provider);
                } else {
                    return Promise.resolve({ batchId: batch.batchId, status: batch.status });
                }
            });
            const statusResults = await Promise.all(statusPromises);
            const updatedBatches = batches.map(batch => {
                const statusResult = statusResults.find(status => status.batchId === batch.batchId);
                return { ...batch, status: statusResult ? statusResult.status : 'Unknown' };
            });
            return updatedBatches;
        } catch (error) {
            console.error('Error fetching statuses:', error);
        }
    };


    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const response = await fetch(getApiUrl('db-batch-list'));
                let batches = await response.json();
                batches = await fetchStatuses(batches);
                setBatches(batches);
            } catch (error) {
                console.error('Error fetching batches:', error);
            }
        };

        fetchBatches();

        const intervalId = setInterval(fetchBatches, 5000); 

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);



    const [clickedBatchIds, setClickedBatchIds] = useState([]);

    const handleButtonClick = (batchId, action) => {
        buttonAction(batchId, action);
        setClickedBatchIds([...clickedBatchIds, batchId]);
    };

    return (
        <GcdsGrid align-content="center" align-items="center" equal-row-height columnsDesktop="1fr 1fr 1fr 1fr 1fr 1fr" tag='div'>
            <p><strong>Batch ID</strong></p>
            <p><strong>Created Date</strong></p>
            <p><strong>Provider</strong></p>
            <p><strong>Type</strong></p>
            <p><strong>Status</strong></p>
            <p><strong>Actions</strong></p>
            {batches
                .filter(batch => batchStatus.split(',').includes(batch.status))
                .map(batch => (
                    <React.Fragment key={batch._id}>
                        <p>{batch.batchId}</p>
                        <p>{batch.createdAt}</p>
                        <p>{batch.provider}</p>
                        <p>{batch.type}</p>
                        <p>{batch.status}</p>
                        <p>
                            {batch.status === 'processed' && !clickedBatchIds.includes(batch.batchId) ? (
                                <>
                                    <GcdsButton onClick={() => handleButtonClick(batch.batchId, 'csv')}>CSV</GcdsButton>
                                    <GcdsButton onClick={() => handleButtonClick(batch.batchId, 'excel')}>Excel</GcdsButton>
                                </>
                            ) : batch.status === 'completed' && !clickedBatchIds.includes(batch.batchId) ? (
                                <GcdsButton onClick={() => handleButtonClick(batch.batchId, batch.provider)}>Process</GcdsButton>
                            ) : (
                                ""
                            )}
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