import React, { useRef, useState } from 'react';
import { getApiUrl } from '../utils/apiToUrl.js';
import { GcdsContainer, GcdsText, GcdsButton } from '@cdssnc/gcds-components-react';
import AuthService from '../services/AuthService.js';

const DatabasePage = ({ lang }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage('');

      const response = await fetch(getApiUrl('db-database-management'), {
        method: 'GET',
        headers: AuthService.getAuthHeader()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to export database');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
        : 'database-backup.json';

      // Create blob from response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMessage('Database exported successfully');
    } catch (error) {
      setMessage(`Export failed: ${error.message}`);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      setMessage('');

      const formData = new FormData();
      formData.append('backup', file);

      const response = await fetch(getApiUrl('db-database-management'), {
        method: 'POST',
        headers: AuthService.getAuthHeader(),
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import database');
      }

      setMessage('Database imported successfully');
      fileInputRef.current.value = '';
    } catch (error) {
      setMessage(`Import failed: ${error.message}`);
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <GcdsContainer size="xl" centered>
      <h1>{lang === 'en' ? 'Database Management' : 'Gestion de la base de données'}</h1>

      <div className="mb-400">
        <h2>{lang === 'en' ? 'Export Database' : 'Exporter la base de données'}</h2>
        <GcdsText>
          {lang === 'en' 
            ? 'Download a complete backup of the database.'
            : 'Télécharger une sauvegarde complète de la base de données.'}
        </GcdsText>
        <GcdsButton
          onClick={handleExport}
          disabled={isExporting}
          className="mb-200"
        >
          {isExporting 
            ? (lang === 'en' ? 'Exporting...' : 'Exportation...')
            : (lang === 'en' ? 'Export Database' : 'Exporter la base de données')}
        </GcdsButton>
      </div>

      <div className="mb-400">
        <h2>{lang === 'en' ? 'Import Database' : 'Importer la base de données'}</h2>
        <GcdsText>
          {lang === 'en'
            ? 'Restore the database from a backup file. Warning: This will replace all existing data.'
            : 'Restaurer la base de données à partir d\'un fichier de sauvegarde. Avertissement : Cela remplacera toutes les données existantes.'}
        </GcdsText>
        <form onSubmit={handleImport} className="mb-200">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            className="mb-200"
            style={{ display: 'block' }}
          />
          <GcdsButton
            type="submit"
            disabled={isImporting}
            variant="secondary"
          >
            {isImporting 
              ? (lang === 'en' ? 'Importing...' : 'Importation...')
              : (lang === 'en' ? 'Import Database' : 'Importer la base de données')}
          </GcdsButton>
        </form>
      </div>

      {message && (
        <div className={message.includes('failed') ? 'text-danger' : 'text-success'}>
          {message}
        </div>
      )}
    </GcdsContainer>
  );
};

export default DatabasePage;