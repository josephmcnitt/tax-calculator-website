import React, { useState, useEffect, useRef } from 'react';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState(null);
  const lastMessageRef = useRef('');
  const chatContainerRef = useRef(null);
  
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      
      // Check if we hit a rate limit
      if (response.status === 429) {
        setIsRateLimited(true);
        setRetryCount(prev => prev + 1);
        
        // Only add the rate limit message if it's the first attempt
        if (retryCount === 0) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'I\'m currently experiencing high demand. Please wait while I try again...' 
          }]);
        }
        
        return;
      }
      
      // Check for timeout
      if (response.status === 408) {
        if (retryCount < 3) {
          // Retry automatically for timeouts
          setRetryCount(prev => prev + 1);
          setIsRateLimited(true);
          
          if (retryCount === 0) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: 'The request is taking longer than expected. I\'ll try again shortly...' 
            }]);
          }
          return;
        } else {
          // After 3 retries, give up
          throw new Error('Request timed out after multiple attempts');
        }
      }
      
      // Handle other error status codes
      if (response.status !== 200) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      // Reset retry count on successful response
      setRetryCount(0);
      setIsRateLimited(false);
      setError(null);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again later.';
      
      // Customize error message based on the error
      if (error.message.includes('timed out')) {
        errorMessage = 'The request timed out. The service might be experiencing high load. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
      setRetryCount(0);
      setIsRateLimited(false);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isRateLimited) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    
    // Store the message for potential retries
    lastMessageRef.current = input;
    setInput('');
    
    await sendMessage(input);
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
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])} 
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear Chat
          </button>
        )}
      </div>
      <div ref={chatContainerRef} className="h-96 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-32">
            <p>Ask me anything about taxes, government spending, or financial matters.</p>
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
          <div className="text-center mt-2">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about taxes..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading || isRateLimited}
          />
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded ${
              isLoading || isRateLimited || !input.trim()
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={isLoading || isRateLimited || !input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot; 