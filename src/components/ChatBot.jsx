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
  
  // Check server status on component mount
  useEffect(() => {
    checkServerStatus();
  }, []);
  
  // Function to check if the server is running
  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      console.log('Checking server status...');
      
      // Use absolute URL to avoid CSP issues
      const apiUrl = window.location.origin + '/api/test';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Explicitly set CORS mode
        credentials: 'same-origin'  // Adjust as needed
      }).catch(error => {
        console.error('Server check failed:', error);
        throw new Error('Cannot connect to server');
      });
      
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
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 30000);
      });
      
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
      
      // Create the fetch promise
      const fetchPromise = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',  // Explicitly set CORS mode
        credentials: 'same-origin',  // Adjust as needed
        body: JSON.stringify({ message: messageText }),
      });
      
      // Race the timeout against the fetch
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
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
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection.';
          // Update server status
          setServerStatus('offline');
        } else if (error.message.includes('timed out')) {
          errorMessage = 'Request timed out. The server might be experiencing high load.';
        } else if (error.message.includes('Content Security Policy')) {
          errorMessage = 'Content Security Policy error. Please contact the administrator.';
          console.error('CSP Error:', error);
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again later.` 
        }]);
      }
    } finally {
      if (!isRateLimited) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    const userInput = input;
    setInput('');
    lastMessageRef.current = userInput; // Save the message for potential retries
    
    // Call the sendMessage function
    await sendMessage(userInput);
  };
  
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    sendMessage(lastMessageRef.current);
  };

  // Calculate retry delay with exponential backoff
  const getRetryDelay = () => {
    const baseDelay = 2000; // 2 seconds
    return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-lg rounded-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Assistant</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            serverStatus === 'online' ? 'bg-green-500' : 
            serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          {messages.length > 0 && (
            <button 
              onClick={() => setMessages([])} 
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>
      <div ref={chatContainerRef} className="h-96 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-32">
            <p>Ask me anything about taxes, government spending, or financial matters.</p>
            {serverStatus === 'offline' && (
              <p className="text-red-500 mt-2">Server is offline. Please try again later.</p>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${
                msg.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-center text-gray-500">
            <p>Thinking...</p>
          </div>
        )}
        {isRateLimited && !isLoading && (
          <div className="text-center text-yellow-500 mt-2">
            <p>Service is busy. Retrying in {Math.round(getRetryDelay() / 1000)} seconds...</p>
          </div>
        )}
        {error && !isLoading && !isRateLimited && (
          <div className="text-center text-red-500 mt-2">
            <p>{error}</p>
            <button 
              onClick={handleRetry}
              className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || serverStatus === 'offline'}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || serverStatus === 'offline'}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot; 