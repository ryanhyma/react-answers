import React, { useState } from 'react';
import { Download } from 'lucide-react';

const ChatLogsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat-logs?days=' + timeRange);
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        console.error('API returned error:', data.error);
        alert(data.error || 'Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert(`Failed to fetch logs: ${error.message}`);
    }
    setLoading(false);
  };

  const downloadLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-logs-' + new Date().toISOString() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-48">
          <label 
            htmlFor="timeRange" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time range
          </label>
          <select
            id="timeRange"
            name="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="1">Last 1 day</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        <button 
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? 'Loading...' : 'Load Logs'}
        </button>
        
        <button 
          type="button"
          onClick={downloadLogs}
          disabled={loading || logs.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Logs
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-4">
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="p-4">
            <p className="mb-4 text-gray-600">Found {logs.length} chat interactions. Download the logs to see the full set and details.</p>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Query
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Length
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {(log.originalQuestion || log.redactedQuestion || '').substring(0, 50)}...
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {(log.aiResponse || '').length} chars
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-gray-500">Select a time range and click 'Load Logs' to view chat history</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLogsDashboard;