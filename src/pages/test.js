import { useEffect } from 'react';
import Head from 'next/head';

export default function TestPage() {
  useEffect(() => {
    // Display connection information
    function showConnectionInfo() {
      document.getElementById('currentUrl').textContent = window.location.href;
      document.getElementById('apiBaseUrl').textContent = window.location.origin;
    }

    // Display browser information
    function showBrowserInfo() {
      const browserInfoDiv = document.getElementById('browserInfo');
      browserInfoDiv.innerHTML = `
          <strong>User Agent:</strong> ${navigator.userAgent}
          <br><strong>Browser:</strong> ${navigator.appName}
          <br><strong>Version:</strong> ${navigator.appVersion}
          <br><strong>Platform:</strong> ${navigator.platform}
          <br><strong>Cookies Enabled:</strong> ${navigator.cookieEnabled}
          <br><strong>Language:</strong> ${navigator.language}
          <br><strong>Online Status:</strong> ${navigator.onLine ? 'Online' : 'Offline'}
          <br><strong>Connection Type:</strong> ${navigator.connection ? navigator.connection.effectiveType : 'Unknown'}
      `;
    }

    // Run network diagnostics
    async function runNetworkDiagnostics() {
      const diagnosticsResultDiv = document.getElementById('diagnosticsResult');
      diagnosticsResultDiv.className = 'result loading';
      diagnosticsResultDiv.textContent = 'Running diagnostics...';
      
      const results = [];
      
      // Check online status
      results.push(`Browser Online Status: ${navigator.onLine ? 'Online' : 'Offline'}`);
      
      // Test connection to common websites
      const sitesToTest = [
          { name: 'Google', url: 'https://www.google.com' },
          { name: 'Vercel', url: 'https://vercel.com' },
          { name: 'OpenAI', url: 'https://api.openai.com' }
      ];
      
      for (const site of sitesToTest) {
          try {
              const startTime = new Date();
              const response = await fetch(site.url, { 
                  method: 'HEAD',
                  mode: 'no-cors',
                  cache: 'no-store'
              });
              const endTime = new Date();
              const duration = endTime - startTime;
              
              results.push(`Connection to ${site.name}: Success (${duration}ms)`);
          } catch (error) {
              results.push(`Connection to ${site.name}: Failed (${error.message})`);
          }
      }
      
      // Test API endpoints with detailed error handling
      try {
          const apiUrl = window.location.origin + '/api/test';
          const startTime = new Date();
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(apiUrl + '?t=' + new Date().getTime(), {
              method: 'GET',
              headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              },
              signal: controller.signal
          }).catch(error => {
              if (error.name === 'AbortError') {
                  throw new Error('Request timed out');
              }
              throw error;
          });
          
          clearTimeout(timeoutId);
          
          const endTime = new Date();
          const duration = endTime - startTime;
          
          if (response.ok) {
              results.push(`API Test Endpoint: Success (${duration}ms)`);
          } else {
              results.push(`API Test Endpoint: Failed with status ${response.status} (${duration}ms)`);
          }
      } catch (error) {
          results.push(`API Test Endpoint: Error - ${error.message}`);
          
          // Add more detailed diagnostics for connection refused errors
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              results.push(`
                  Possible causes for connection refused:
                  - Server is not running
                  - Firewall is blocking the connection
                  - Incorrect port or hostname
                  - Network connectivity issues
                  
                  Recommendations:
                  - Check if the server is running
                  - Verify the URL is correct (${window.location.origin})
                  - Check for any network issues
                  - Try accessing the site from a different network
              `);
          }
      }
      
      // Display results
      diagnosticsResultDiv.className = 'result';
      diagnosticsResultDiv.innerHTML = results.join('<br><br>');
    }

    // Test the /api/test endpoint
    async function testApiEndpoint() {
      const testResultDiv = document.getElementById('testResult');
      const testStatusSpan = document.getElementById('testStatus');
      
      testResultDiv.className = 'result loading';
      testResultDiv.textContent = 'Testing API...';
      testStatusSpan.textContent = 'Testing...';
      testStatusSpan.style.backgroundColor = '#fff3cd';
      
      try {
          console.log('Fetching /api/test...');
          const startTime = new Date();
          
          // Add cache-busting parameter and abort controller for timeout
          const apiUrl = '/api/test?t=' + new Date().getTime();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              },
              signal: controller.signal
          }).catch(error => {
              console.error('Fetch error:', error);
              if (error.name === 'AbortError') {
                  throw new Error('Request timed out after 10 seconds');
              } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                  throw new Error('Connection refused. Server may be down or unreachable.');
              } else {
                  throw error;
              }
          });
          
          clearTimeout(timeoutId);
          
          const endTime = new Date();
          const duration = endTime - startTime;
          
          console.log('Response status:', response.status);
          
          if (response.ok) {
              const data = await response.json();
              console.log('API test response:', data);
              
              testResultDiv.className = 'result success';
              testResultDiv.innerHTML = `
                  <strong>Status:</strong> ${response.status} ${response.statusText}
                  <br><strong>Time:</strong> ${duration}ms
                  <br><strong>API Key Configured:</strong> ${data.apiKeyConfigured ? 'Yes' : 'No'}
                  <br><strong>Environment:</strong> ${JSON.stringify(data.environment, null, 2)}
                  <br><strong>Headers:</strong> ${JSON.stringify(data.headers, null, 2)}
                  <br><strong>Full Response:</strong> <pre>${JSON.stringify(data, null, 2)}</pre>
              `;
              
              testStatusSpan.textContent = 'Online';
              testStatusSpan.style.backgroundColor = '#d4edda';
          } else {
              let errorText = `Status: ${response.status} ${response.statusText}`;
              try {
                  const errorData = await response.json();
                  errorText += `\nError details: ${JSON.stringify(errorData, null, 2)}`;
              } catch (e) {
                  errorText += '\nCould not parse error response';
              }
              
              testResultDiv.className = 'result error';
              testResultDiv.textContent = errorText;
              
              testStatusSpan.textContent = 'Error';
              testStatusSpan.style.backgroundColor = '#f8d7da';
          }
      } catch (error) {
          console.error('Error testing API:', error);
          
          testResultDiv.className = 'result error';
          testResultDiv.innerHTML = `
              <strong>Error:</strong> ${error.message}
              <br><br>
              <strong>Troubleshooting:</strong>
              ${error.message.includes('Connection refused') ? `
              <ul>
                  <li>The server appears to be down or unreachable</li>
                  <li>Check if the server is running</li>
                  <li>Verify that the API endpoint is correct</li>
                  <li>Check for any network or firewall issues</li>
              </ul>
              ` : ''}
          `;
          
          testStatusSpan.textContent = 'Offline';
          testStatusSpan.style.backgroundColor = '#f8d7da';
      }
    }

    // Test the /api/chat endpoint
    async function testChatEndpoint() {
      const messageInput = document.getElementById('messageInput');
      const message = messageInput.value.trim();
      
      if (!message) {
          alert('Please enter a message');
          return;
      }
      
      const chatResultDiv = document.getElementById('chatResult');
      const chatStatusSpan = document.getElementById('chatStatus');
      
      chatResultDiv.className = 'result loading';
      chatResultDiv.textContent = 'Sending message to API...';
      chatStatusSpan.textContent = 'Testing...';
      chatStatusSpan.style.backgroundColor = '#fff3cd';
      
      try {
          console.log('Sending message to /api/chat:', message);
          const startTime = new Date();
          
          // Add abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              },
              body: JSON.stringify({ message }),
              signal: controller.signal
          }).catch(error => {
              console.error('Fetch error:', error);
              if (error.name === 'AbortError') {
                  throw new Error('Request timed out after 30 seconds');
              } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                  throw new Error('Connection refused. Server may be down or unreachable.');
              } else {
                  throw error;
              }
          });
          
          clearTimeout(timeoutId);
          
          const endTime = new Date();
          const duration = endTime - startTime;
          
          console.log('Response status:', response.status);
          
          if (response.ok) {
              const data = await response.json();
              console.log('Chat API response:', data);
              
              chatResultDiv.className = 'result success';
              chatResultDiv.innerHTML = `
                  <strong>Status:</strong> ${response.status} ${response.statusText}
                  <br><strong>Time:</strong> ${duration}ms
                  <br><strong>Response:</strong> ${data.message}
                  <br><strong>Full Response:</strong> <pre>${JSON.stringify(data, null, 2)}</pre>
              `;
              
              chatStatusSpan.textContent = 'Working';
              chatStatusSpan.style.backgroundColor = '#d4edda';
          } else {
              let errorText = `Status: ${response.status} ${response.statusText}`;
              try {
                  const errorData = await response.json();
                  errorText += `\nError details: ${JSON.stringify(errorData, null, 2)}`;
              } catch (e) {
                  errorText += '\nCould not parse error response';
              }
              
              chatResultDiv.className = 'result error';
              chatResultDiv.textContent = errorText;
              
              chatStatusSpan.textContent = 'Error';
              chatStatusSpan.style.backgroundColor = '#f8d7da';
          }
      } catch (error) {
          console.error('Error testing chat API:', error);
          
          chatResultDiv.className = 'result error';
          chatResultDiv.innerHTML = `
              <strong>Error:</strong> ${error.message}
              <br><br>
              <strong>Troubleshooting:</strong>
              ${error.message.includes('Connection refused') ? `
              <ul>
                  <li>The server appears to be down or unreachable</li>
                  <li>Check if the server is running</li>
                  <li>Verify that the API endpoint is correct</li>
                  <li>Check for any network or firewall issues</li>
              </ul>
              ` : ''}
          `;
          
          chatStatusSpan.textContent = 'Error';
          chatStatusSpan.style.backgroundColor = '#f8d7da';
      }
    }

    // Set up event listeners
    document.getElementById('testApiBtn').addEventListener('click', testApiEndpoint);
    document.getElementById('chatApiBtn').addEventListener('click', testChatEndpoint);
    document.getElementById('runDiagnosticsBtn').addEventListener('click', runNetworkDiagnostics);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        testChatEndpoint();
      }
    });

    // Initialize
    showConnectionInfo();
    showBrowserInfo();
  }, []);

  return (
    <>
      <Head>
        <title>API Test Page</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <h1>API Test Page</h1>
        <p>Use this page to test if the API endpoints are working correctly.</p>

        <div className="connection-info" style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px'
        }}>
          <h3>Connection Information</h3>
          <p><strong>Current URL:</strong> <span id="currentUrl"></span></p>
          <p><strong>API Base URL:</strong> <span id="apiBaseUrl"></span></p>
        </div>

        <div className="container" style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <div className="header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2>Test API Endpoint</h2>
            <span id="testStatus" className="status" style={{
              fontSize: '14px',
              padding: '5px 10px',
              borderRadius: '20px'
            }}>Unknown</span>
          </div>
          <p>This will test the basic API connectivity and configuration.</p>
          <button id="testApiBtn" style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}>Test API</button>
          <div id="testResult" className="result" style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflowY: 'auto'
          }}></div>
        </div>

        <div className="container" style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <div className="header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2>Chat API Endpoint</h2>
            <span id="chatStatus" className="status" style={{
              fontSize: '14px',
              padding: '5px 10px',
              borderRadius: '20px'
            }}>Unknown</span>
          </div>
          <p>This will test the OpenAI integration.</p>
          <input 
            type="text" 
            id="messageInput" 
            placeholder="Enter a message to send to the API" 
            defaultValue="Tell me about income tax."
            style={{
              padding: '8px',
              width: '100%',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button id="chatApiBtn" style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}>Test Chat API</button>
          <div id="chatResult" className="result" style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflowY: 'auto'
          }}></div>
        </div>

        <div className="container" style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <div className="header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2>Network Diagnostics</h2>
            <button id="runDiagnosticsBtn" style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}>Run Diagnostics</button>
          </div>
          <div id="diagnosticsResult" className="result" style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflowY: 'auto'
          }}></div>
        </div>

        <div className="container" style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h2>Browser Information</h2>
          <div id="browserInfo" className="result" style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflowY: 'auto'
          }}></div>
        </div>

        <style jsx>{`
          .result.success {
            background-color: #d4edda;
            color: #155724;
          }
          .result.error {
            background-color: #f8d7da;
            color: #721c24;
          }
          .result.loading {
            background-color: #fff3cd;
            color: #856404;
          }
          button:hover {
            background-color: #0069d9;
          }
        `}</style>
      </div>
    </>
  );
} 