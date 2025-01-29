import React from 'react';

import * as XLSX from 'xlsx';
// import { useTranslations } from '../hooks/useTranslations';
import { GcdsContainer, GcdsText, GcdsLink } from '@cdssnc/gcds-components-react';
import BatchUpload from '../components/batch/BatchUpload.js';
import BatchList from '../components/batch/BatchList.js';
import { getApiUrl, getProviderApiUrl } from '../utils/apiToUrl.js';
import { useTranslations } from '../hooks/useTranslations.js';
import ExportService from '../services/ExportService.js';



const BatchPage = ({ lang = 'en' }) => {
  const { t } = useTranslations(lang);

  


  const handleDownloadClick = (batchId, type) => {
    console.log('Button clicked for batch:', batchId);
    const fetchBatchAndDownload = async (batchId, type) => {
      try {
        const response = await fetch(getApiUrl(`db-batch-retrieve?batchId=${batchId}`));
        const batch = await response.json();
        const items = Array.isArray(batch.interactions) ? batch.interactions : [batch.interactions];
        const { headers, rows } = ExportService.jsonToFlatTable(items);

        const filteredHeaders = headers.filter(header => !header.includes('_id') && !header.includes('__v'));
        const filteredRows = rows.map(row => 
          filteredHeaders.map(header => row[headers.indexOf(header)])
        );
        
        const uppercaseHeaders = filteredHeaders.map(header => header.toUpperCase().replace(/\./g, '_'));
        const worksheetData = [uppercaseHeaders, ...filteredRows];
        
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
          const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Data');

          const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
          const blob = new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `batch_${batchId}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
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
      await fetch(getProviderApiUrl(provider, `batch-cancel?batchId=${batchId}`));
    } else {
      console.log('Button clicked to complete batch:', batchId);
      await fetch(getProviderApiUrl(provider, `batch-process-results?batchId=${batchId}`));
    }
  };





  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className='mb-400'>{t('batch.navigation.title')}</h1>
      <nav className="mb-400" aria-label={t('batch.navigation.ariaLabel')}>
        <h2 className='mt-400 mb-400'>{t('batch.navigation.links.onThisPage')}</h2>
        <ul>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#evaluator">{t('batch.navigation.links.newEvaluation')}</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#running-evaluation">{t('batch.navigation.links.runningBatches')}</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#processed-evaluation">{t('batch.navigation.links.processedBatches')}</GcdsLink>
            </GcdsText>
          </li>
        </ul>
      </nav>

      <section id="evaluator" className="mb-600">
        <h2 className='mt-400 mb-400'>{t('batch.sections.evaluator.title')}</h2>
        <BatchUpload lang={lang} />
      </section>

      <section id="running-evaluation" className="mb-600">
        <h2 className='mt-400 mb-400'>{t('batch.sections.running.title')}</h2>
        <BatchList
          buttonAction={handleCompleteCancelClick}
          batchStatus="processing,completed" lang={lang} />
      </section>

      <section id="processed-evaluation" className="mb-600">
        <h2 className='mt-400 mb-400'>{t('batch.sections.processed.title')}</h2>
        <BatchList
          buttonAction={handleDownloadClick}
          batchStatus="processed" lang={lang} />
      </section>

    </GcdsContainer>
  );
};

export default BatchPage;