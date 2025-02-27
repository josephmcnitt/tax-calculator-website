const express = require('express');
const path = require('path');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from React app
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Log the API key (first few characters only for security)
const apiKey = process.env.OPENAI_API_KEY;
console.log('API Key first few chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'Not found');

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Helper function to call OpenAI with timeout and retry
async function callOpenAIWithRetry(message, maxRetries = 2, timeout = 15000) {  // Increased timeout
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeout);
      });
      
      // Create the OpenAI API call promise
      const apiCallPromise = openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful tax assistant. You can provide general information about taxes, government spending, and financial matters. Always clarify that you're providing general information and users should consult with tax professionals for specific advice."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,  // Limit response size to avoid timeouts
        temperature: 0.7,
      });
      
      // Race the timeout against the API call
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      return result;
    } catch (error) {
      console.error('Error details:', error);
      retries++;
      
      // If we've used all retries, or it's not a retryable error, throw it
      if (retries > maxRetries || (error.response && error.response.status !== 429 && error.response.status !== 500)) {
        throw error;
      }
      
      // Exponential backoff
      const delay = 1000 * Math.pow(2, retries);
      console.log(`Retrying OpenAI API call in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Simple rate limiting implementation
const rateLimiter = {
  tokens: 10, // Start with 10 tokens
  lastRefill: Date.now(),
  refillRate: 1, // Tokens per second
  maxTokens: 10,
  
  // Check if a request can be made
  canMakeRequest() {
    this.refillTokens();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  },
  
  // Refill tokens based on elapsed time
  refillTokens() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
};

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  // Check rate limit before processing
  if (!rateLimiter.canMakeRequest()) {
    console.log('Local rate limit exceeded');
    return res.status(429).json({ 
      message: 'Too many requests. Please try again later.',
      isRateLimit: true
    });
  }
  
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log('Processing message:', message);
    const completion = await callOpenAIWithRetry(message);
    console.log('Received response from OpenAI');
    
    // Updated to match the new OpenAI SDK response format
    res.status(200).json({ message: completion.data.choices[0].message.content });
  } catch (error) {
    // Log detailed error information
    console.error('Error in /api/chat endpoint:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('OpenAI API Error Response:');
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      // Check if the error is related to the API key
      if (error.response.status === 401) {
        console.error('API Key Error: The API key might be invalid, expired, or revoked.');
        return res.status(500).json({ 
          message: 'There was an authentication problem with the AI service. Please contact support.' 
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from OpenAI API:');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    // Check if it's a timeout error
    if (error.message === 'Request timed out') {
      console.log('Request to OpenAI API timed out');
      return res.status(408).json({ 
        message: 'Request timed out. Please try again.',
        isTimeout: true
      });
    }
    
    // Check if it's a rate limit error (429)
    if (error.response && error.response.status === 429) {
      console.log('OpenAI API rate limit exceeded');
      return res.status(429).json({ 
        message: 'Rate limit exceeded. Please try again in a moment.',
        isRateLimit: true
      });
    }
    
    // Handle other API errors
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage = error.response.data.error.message || 'Unknown API error';
      console.log(`OpenAI API error: ${errorMessage}`);
      return res.status(error.response.status || 500).json({ 
        message: `API Error: ${errorMessage}` 
      });
    }
    
    // Generic error
    console.log('Generic server error:', error.message);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 