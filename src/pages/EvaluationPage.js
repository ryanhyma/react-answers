import React from 'react';
import * as XLSX from 'xlsx';
// import { useTranslations } from '../hooks/useTranslations';
import { GcdsContainer, GcdsText, GcdsLink } from '@cdssnc/gcds-components-react';
import Evaluator from '../components/eval/Evaluator.js';
import BatchList from '../components/eval/BatchList.js';
import { getApiUrl, getProviderApiUrl } from '../utils/apiToUrl.js';
import { ConnectionClosedEvent } from 'mongodb';


const EvaluationPage = ({ lang = 'en' }) => {
  // const { t } = useTranslations(lang);  //TODO: uncomment this when we have translations for this page 
  const [status, setStatus] = React.useState({
    isAvailable: true,
    message: ''
  });

  const handleDownloadClick = (batchId, type) => {
    console.log('Button clicked for batch:', batchId);
    const fetchBatchAndDownload = async (batchId, type) => {
      try {
        const response = await fetch(getApiUrl(`db-batch-retrieve?batchId=${batchId}`));
        const batch = await response.json();

        if (batch && batch.entries) {
          const worksheetData = [
            ['entry_id', 'question', 'url', 'topic', 'topicUrl', 'department', 'departmentUrl', 'searchResults', 'context_model', 'context_input_tokens', 'context_output_tokens', 'context_cached_creation_input_tokens', 'context_cached_read_input_tokens', 'answer', 'answer_citation_url', 'answer_citation_head', 'answer_citation_confidence', 'answer_model', 'answer_input_tokens', 'answer_output_tokens', 'answer_cached_creation_input_tokens', 'answer_cached_read_input_tokens'],
            ...batch.entries.map(entry => [
              entry.entry_id,
              entry.question,
              entry.url,
              entry.topic,
              entry.topicUrl,
              entry.department,
              entry.departmentUrl,
              entry.searchResults,
              entry.context_model,
              entry.context_input_tokens,
              entry.context_output_tokens,
              entry.context_cached_creation_input_tokens,
              entry.context_cached_read_input_tokens,
              entry.answer,
              entry.answer_citation_url,
              entry.answer_citation_head,
              entry.answer_citation_confidence,
              entry.answer_model,
              entry.answer_input_tokens,
              entry.answer_output_tokens,
              entry.answer_cached_creation_input_tokens,
              entry.answer_cached_read_input_tokens
            ])
          ];

          if (type === 'excel') {
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Bold the headings
            const headingRange = XLSX.utils.decode_range(worksheet['!ref']);
            for (let C = headingRange.s.c; C <= headingRange.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
              if (!worksheet[cellAddress]) continue;
              if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
              if (!worksheet[cellAddress].s.font) worksheet[cellAddress].s.font = {};
              worksheet[cellAddress].s.font.bold = true;
            }

            // Add filters
            worksheet['!autofilter'] = { ref: worksheet['!ref'] };

            // Adjust column widths
            const colWidths = worksheetData[0].map((_, colIndex) => ({
              wch: Math.max(...worksheetData.map(row => (row[colIndex] ? row[colIndex].toString().length : 10)))
            }));
            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Data');

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `batch_${batchId}.xlsx`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (type === 'csv') {
            const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(worksheetData));
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `batch_${batchId}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      } catch (error) {
        console.error('Error fetching batch or creating file:', error);
      }
    };

    fetchBatchAndDownload(batchId, type);
  };

  const handleCompleteCancelClick = async (batchId, action, provider,) => {
    if (action === 'cancel') {
      console.log('Button clicked to cancel batch:', batchId);
      const response = await fetch(getProviderApiUrl(provider, `batch-cancel?batchId=${batchId}`));
    } else {
      console.log('Button clicked to complete batch:', batchId);
      const response = await fetch(getProviderApiUrl(provider, `batch-process-results?batchId=${batchId}`));
      console.log(response.log);
    }
  };





  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className='mb-400'>Evaluation</h1>
      <nav className="mb-400" aria-label="On this page">
        <h2 className='mt-400 mb-400'>On this page</h2>
        <ul>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#evaluator">New Evaluation</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#running-evaluation">Running batches</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#processed-evaluation">Processed Batches</GcdsLink>
            </GcdsText>
          </li>
        </ul>
      </nav>

      <section id="evaluator" className="mb-600">
        <h2 className='mt-400 mb-400'>Load and run evaluation</h2>
        <Evaluator />
      </section>

      <section id="running-evaluation" className="mb-600">
        <h2 className='mt-400 mb-400'>Running Batches</h2>
        <BatchList
          buttonAction={handleCompleteCancelClick}
          batchStatus="processing,completed" />
      </section>

      <section id="processed-evaluation" className="mb-600">
        <h2 className='mt-400 mb-400'>Processed Evaluations</h2>
        <BatchList
          buttonAction={handleDownloadClick}
          batchStatus="processed" />
      </section>

    </GcdsContainer>
  );
};

export default EvaluationPage;