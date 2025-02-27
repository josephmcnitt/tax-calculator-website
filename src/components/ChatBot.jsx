'use client';

import React, { useState, useEffect, useRef } from 'react';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const lastMessageRef = useRef('');
  const chatContainerRef = useRef(null);
  
  // Check server status on component mount - only on client side
  useEffect(() => {
    // Make sure we're running in the browser
    if (typeof window !== 'undefined') {
      checkServerStatus();
      
      // Add periodic server status check every 30 seconds
      const intervalId = setInterval(() => {
        if (serverStatus === 'offline') {
          console.log('Periodic server status check...');
          checkServerStatus();
        }
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [serverStatus]);
  
  // Function to check if the server is running
  const checkServerStatus = async () => {
    // Make sure we're running in the browser
    if (typeof window === 'undefined') {
      console.log('Running in server environment, skipping server status check');
      return false;
    }
    
    try {
      setServerStatus('checking');
      console.log('Checking server status...');
      
      // Use absolute URL to avoid CSP issues
      const apiUrl = window.location.origin + '/api/test';
      console.log('API URL:', apiUrl);
      
      // Add cache-busting parameter to prevent caching
      const urlWithCacheBuster = `${apiUrl}?t=${new Date().getTime()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(urlWithCacheBuster, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        mode: 'cors',  // Explicitly set CORS mode
        credentials: 'same-origin',  // Adjust as needed
        signal: controller.signal
      }).catch(error => {
        console.error('Server check failed:', error);
        if (error.name === 'AbortError') {
          throw new Error('Server check timed out');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Connection refused. Server may be down or unreachable.');
        } else {
          throw error;
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Server status check response:', data);
        setServerStatus('online');
        return true;
      } else {
        console.error('Server status check failed with status:', response.status);
        try {
          const errorData = await response.json();
          console.error('Server error details:', errorData);
        } catch (e) {
          console.error('Could not parse server error response');
        }
        setServerStatus('offline');
        return false;
      }
    } catch (error) {
      console.error('Server status check error:', error);
      setServerStatus('offline');
      return false;
    }
  };
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Effect to handle automatic retry when rate limited
  useEffect(() => {
    let retryTimer;
    
    if (isRateLimited && !isLoading && retryCount < 3) {
      const delay = getRetryDelay();
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      
      retryTimer = setTimeout(() => {
        console.log('Retrying request...');
        setIsRateLimited(false);
        sendMessage(lastMessageRef.current);
      }, delay);
    } else if (retryCount >= 3 && isRateLimited) {
      // After 3 automatic retries, stop and allow manual retry
      setIsRateLimited(false);
      setError('Maximum automatic retries reached. You can try again manually.');
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isRateLimited, isLoading, retryCount]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    // Store the message for potential retries
    lastMessageRef.current = messageText;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setInput('');
    
    // Check server status before sending message
    if (serverStatus !== 'online') {
      const isServerOnline = await checkServerStatus();
      if (!isServerOnline) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I'm sorry, I can't connect to the server. Please try again later.` 
        }]);
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Sending message to API:', messageText);
      
      // Log request details
      const requestStartTime = new Date();
      console.log('Chat request details:', {
        timestamp: requestStartTime.toISOString(),
        messageLength: messageText.length,
        endpoint: '/api/chat'
      });
      
      // Use absolute URL to avoid CSP issues
      const apiUrl = window.location.origin + '/api/chat';
      console.log('API URL:', apiUrl);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Create the fetch request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        mode: 'cors',  // Explicitly set CORS mode
        credentials: 'same-origin',  // Adjust as needed
        body: JSON.stringify({ message: messageText }),
        signal: controller.signal
      }).catch(error => {
        console.error('Fetch error:', error);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Connection refused. Server may be down or unreachable.');
        } else {
          throw error;
        }
      });
      
      clearTimeout(timeoutId);
      
      const requestEndTime = new Date();
      const requestDuration = requestEndTime - requestStartTime;
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        duration: requestDuration + 'ms',
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to get response';
        let errorDetails = {};
        
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
          
          // Check if it's a rate limit error
          if (response.status === 429 || errorData.error === 'RATE_LIMIT') {
            setIsRateLimited(true);
            setRetryCount(prev => prev + 1);
            throw new Error('Rate limit exceeded');
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        // Log detailed error information
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorDetails,
          requestDuration
        });
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API response data:', {
        status: data.status,
        messageLength: data.message ? data.message.length : 0,
        timestamp: new Date().toISOString()
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error details:', error);
      
      // Don't add error message if it's a rate limit error (will be retried)
      if (!isRateLimited) {
        let errorMessage = error.message;
        
        // Provide more user-friendly error messages
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Connection refused')) {
          errorMessage = 'Network error. The server appears to be down or unreachable. Please try again later.';
          // Update server status
          setServerStatus('offline');
        } else if (error.message.includes('timed out')) {
          errorMessage = 'The request timed out. The server might be overloaded or unreachable.';
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I'm sorry, there was an error: ${errorMessage}` 
        }]);
        
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      await sendMessage(input);
    }
  };
  
  const handleRetry = () => {
    if (lastMessageRef.current && !isLoading) {
      setError(null);
      setRetryCount(0);
      setIsRateLimited(false);
      sendMessage(lastMessageRef.current);
    }
  };
  
  const getRetryDelay = () => {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
    return Math.floor(exponentialDelay + jitter);
  };
  
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Tax Assistant</h2>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            serverStatus === 'online' ? 'bg-green-500' : 
            serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {serverStatus === 'online' ? 'Server Online' : 
             serverStatus === 'offline' ? 'Server Offline' : 'Checking Server...'}
          </span>
        </div>
      </div>
      
      {serverStatus === 'offline' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Server is offline</p>
          <p>Please start the server or try again later.</p>
          <button 
            onClick={checkServerStatus}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          >
            Check Again
          </button>
        </div>
      )}
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded"
        style={{ minHeight: '300px', maxHeight: '60vh' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>Ask me anything about taxes!</p>
            <p className="text-sm mt-2">For example:</p>
            <ul className="text-sm mt-1">
              <li>"What tax deductions are available for small businesses?"</li>
              <li>"How do I calculate my self-employment tax?"</li>
              <li>"What's the difference between standard and itemized deductions?"</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
              <div className="flex items-center">
                <div className="dot-typing"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && !isRateLimited && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          {lastMessageRef.current && (
            <button 
              onClick={handleRetry}
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Retry
            </button>
          )}
        </div>
      )}
      
      {isRateLimited && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Rate Limited</p>
          <p>Too many requests. Retrying automatically...</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your tax question here..."
          className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || serverStatus === 'offline'}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded-r font-bold text-white ${
            isLoading || input.trim() === '' || serverStatus === 'offline'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700'
          }`}
          disabled={isLoading || input.trim() === '' || serverStatus === 'offline'}
        >
          Send
        </button>
      </form>
      
      <style jsx>{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #6b7280;
          color: #6b7280;
          box-shadow: 9984px 0 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          animation: dot-typing 1.5s infinite linear;
        }
        
        @keyframes dot-typing {
          0% {
            box-shadow: 9984px 0 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          }
          50% {
            box-shadow: 9984px 0 0 0 #6b7280, 9999px -10px 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px -10px 0 0 #6b7280;
          }
          100% {
            box-shadow: 9984px 0 0 0 #6b7280, 9999px 0 0 0 #6b7280, 10014px 0 0 0 #6b7280;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatBot; 