const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow requests from React app
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Log the API key (first few characters only for security)
const apiKey = process.env.OPENAI_API_KEY;
console.log('API Key first few chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'Not found');

// Validate API key
if (!apiKey) {
  console.error('ERROR: OPENAI_API_KEY is not defined in .env file');
}

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Direct API call to OpenAI without using the SDK
function callOpenAIDirectly(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
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
      max_tokens: 500,
      temperature: 0.7,
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
          }
        } else {
          try {
            const errorData = JSON.parse(responseData);
            reject({
              status: res.statusCode,
              data: errorData
            });
          } catch (error) {
            reject({
              status: res.statusCode,
              data: { error: { message: `OpenAI API error: ${responseData}` } }
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Test OpenAI configuration
app.get('/api/test', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }
    res.status(200).json({ message: 'OpenAI API key is configured' });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ message: 'Error testing API configuration' });
  }
});

// Handle OPTIONS requests for CORS preflight
app.options('/api/chat', (req, res) => {
  res.status(200).end();
});

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    // Check if API key is configured
    if (!apiKey) {
      console.error('API Key is missing');
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Please check server configuration.',
        error: 'API_KEY_MISSING'
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ 
        message: 'Message is required',
        error: 'MISSING_MESSAGE'
      });
    }

    console.log('Processing message:', message);
    
    try {
      // Try direct API call first
      const completion = await callOpenAIDirectly(message);
      console.log('Received response from OpenAI (direct API)');
      
      if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        console.error('Invalid response structure from OpenAI:', completion);
        return res.status(500).json({ 
          message: 'Received an invalid response from the AI service.',
          error: 'INVALID_RESPONSE_STRUCTURE'
        });
      }
      
      res.status(200).json({ message: completion.choices[0].message.content });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Handle specific OpenAI errors
      if (openaiError.status) {
        const status = openaiError.status;
        const data = openaiError.data;
        
        if (status === 401) {
          return res.status(500).json({ 
            message: 'Authentication error with the AI service. Please check API key.',
            error: 'AUTH_ERROR'
          });
        } else if (status === 429) {
          return res.status(429).json({ 
            message: 'Rate limit exceeded. Please try again in a moment.',
            error: 'RATE_LIMIT'
          });
        } else {
          return res.status(status).json({ 
            message: data.error?.message || 'Error from AI service',
            error: 'OPENAI_ERROR'
          });
        }
      } else {
        throw openaiError; // Let the outer catch handle it
      }
    }
  } catch (error) {
    // Log detailed error information
    console.error('Error in /api/chat endpoint:', error);
    
    // Generic error
    res.status(500).json({ 
      message: 'An error occurred while processing your request.',
      error: error.message
    });
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 