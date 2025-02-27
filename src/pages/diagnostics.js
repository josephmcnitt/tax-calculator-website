import React, { useState, useEffect } from 'react';

export default function Diagnostics() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [browserInfo, setBrowserInfo] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Only run on client-side
  useEffect(() => {
    // Set browser information once component is mounted (client-side only)
    setBrowserInfo({
      userAgent: navigator.userAgent,
      origin: window.location.origin,
      protocol: window.location.protocol
    });
    
    addLog('Diagnostics page loaded', 'info');
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      addLog('Checking API status...', 'info');
      setApiStatus('checking');
      setError(null);

      // Only run on client-side
      if (typeof window === 'undefined') {
        addLog('Running in server environment, skipping API check', 'info');
        return;
      }

      // Use absolute URL to avoid CSP issues
      const apiUrl = window.location.origin + '/api/test';
      addLog(`API URL: ${apiUrl}`, 'info');

      // Add cache-busting parameter
      const urlWithCacheBuster = `${apiUrl}?t=${new Date().getTime()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      addLog('Sending request to API...', 'info');
      const response = await fetch(urlWithCacheBuster, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        mode: 'cors',
        credentials: 'same-origin',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        addLog('API response received successfully', 'success');
        addLog(`API status: ${data.status}`, 'success');
        setApiResponse(data);
        setApiStatus('online');
      } else {
        addLog(`API returned error status: ${response.status}`, 'error');
        setApiStatus('error');
        setError(`HTTP Error: ${response.status} ${response.statusText}`);
        
        try {
          const errorData = await response.json();
          addLog(`Error details: ${JSON.stringify(errorData)}`, 'error');
        } catch (e) {
          addLog('Could not parse error response', 'error');
        }
      }
    } catch (error) {
      addLog(`Error checking API: ${error.message}`, 'error');
      setApiStatus('error');
      setError(error.message);
      
      if (error.name === 'AbortError') {
        addLog('Request timed out', 'error');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        addLog('Network error - server may be down or unreachable', 'error');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Diagnostics</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">API Status</h2>
        <div className="flex items-center mb-2">
          <div className={`w-4 h-4 rounded-full mr-2 ${
            apiStatus === 'online' ? 'bg-green-500' : 
            apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span>
            {apiStatus === 'online' ? 'Online' : 
             apiStatus === 'error' ? 'Error' : 'Checking...'}
          </span>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <button 
          onClick={checkApiStatus}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Check API Status
        </button>
      </div>
      
      {apiResponse && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">API Response</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {browserInfo && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Browser Information</h2>
          <table className="min-w-full bg-white">
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold">User Agent</td>
                <td className="px-4 py-2">{browserInfo.userAgent}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold">Origin</td>
                <td className="px-4 py-2">{browserInfo.origin}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 font-semibold">Protocol</td>
                <td className="px-4 py-2">{browserInfo.protocol}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={`mb-1 ${
                log.type === 'error' ? 'text-red-600' : 
                log.type === 'success' ? 'text-green-600' : 'text-gray-800'
              }`}
            >
              <span className="text-xs text-gray-500">{log.timestamp}</span>: {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 