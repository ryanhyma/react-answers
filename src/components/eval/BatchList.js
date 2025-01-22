import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot
import DataTable from 'datatables.net-react';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import DT from 'datatables.net-dt';
import { GcdsButton } from '@cdssnc/gcds-components-react';
import { getApiUrl, getProviderApiUrl } from '../../utils/apiToUrl.js';

DataTable.use(DT);

const BatchList = ({ buttonAction, batchStatus }) => {
  const [batches, setBatches] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Fetch batch status
  const fetchStatus = async (batchId, provider) => {
    try {
      const response = await fetch(getProviderApiUrl(provider, `batch-status?batchId=${batchId}`));
      const data = await response.json();
      return { batchId, status: data.status };
    } catch (error) {
      console.error(`Error fetching status for batch ${batchId}:`, error);
      return { batchId, status: 'Error' };
    }
  };

  // Fetch all statuses
  const fetchStatuses = async (batches) => {
    try {
      const statusPromises = batches.map((batch) => {
        if (!batch.status) {
          return fetchStatus(batch.batchId, batch.provider);
        } else {
          return Promise.resolve({ batchId: batch.batchId, status: batch.status });
        }
      });
      const statusResults = await Promise.all(statusPromises);
      return batches.map((batch) => {
        const statusResult = statusResults.find((status) => status.batchId === batch.batchId);
        return { ...batch, status: statusResult ? statusResult.status : 'Unknown' };
      });
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  // Fetch batches
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

    const intervalId = setInterval(fetchBatches, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Handle button click
  const handleButtonClick = (batchId, action, provider) => {
    buttonAction(batchId, action, provider);
  };

  // Filter batches based on batchStatus and search text
  const filteredBatches = batches.filter(
    (batch) =>
      batchStatus.split(',').includes(batch.status) &&
      Object.values(batch).some((value) =>
        value?.toString().toLowerCase().includes(searchText.toLowerCase())
      )
  );

  return (
    <div>
      <DataTable
        data={filteredBatches}
        columns={[
          { title: 'Batch ID', data: 'batchId' },
          { title: 'Created Date', data: 'createdAt' },
          { title: 'Provider', data: 'provider' },
          { title: 'Type', data: 'type' },
          { title: 'Status', data: 'status' },
          {
            title: 'Actions',
            data: null, // Data is not directly mapped for actions
            defaultContent: '', // Avoid undefined content
          },
        ]}
        options={{
          paging: true,
          searching: true,
          ordering: true,
          order: [[1, 'desc']], // Order by Created Date (column index 1) descending
          createdRow: (row, data) => {
            const { batchId, status, provider } = data;

            // Clear and append custom buttons dynamically
            const actionsCell = row.querySelector('td:last-child');
            if (status === 'processed') {
              actionsCell.innerHTML = '';
              const root = createRoot(actionsCell);
              root.render(
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <GcdsButton size="small" onClick={() => handleButtonClick(batchId, 'csv')}>
                      CSV
                    </GcdsButton>
                    <GcdsButton size="small" onClick={() => handleButtonClick(batchId, 'excel')}>
                      Excel
                    </GcdsButton>
                  </div>
                </>
              );
            } else if (status === 'completed') {
              actionsCell.innerHTML = '';
              const root = createRoot(actionsCell);
              root.render(
                <GcdsButton
                  size="small"
                  onClick={() => handleButtonClick(batchId, 'complete', provider)}
                >
                  Evaluate
                </GcdsButton>
              );
            } else if (status === 'processing') {
              actionsCell.innerHTML = '';
              const root = createRoot(actionsCell);
              root.render(
                <GcdsButton
                  size="small"
                  onClick={() => handleButtonClick(batchId, 'cancel', provider)}
                >
                  Cancel
                </GcdsButton>
              );
            }
          },
        }}
      />
    </div>
  );
};

export default BatchList;
