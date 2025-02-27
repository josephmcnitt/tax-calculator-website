const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Check if OpenAI API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('⚠️ OpenAI API key is not configured. Please add it to your .env file.');
}

// Configure CORS to allow requests from both localhost and 127.0.0.1
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
const buildExists = fs.existsSync(buildPath);
console.log(`Build directory ${buildExists ? 'found' : 'not found'} at: ${buildPath}`);

// Function to make direct API calls to OpenAI
function callOpenAIDirectly(message) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY) {
      return reject(new Error('OpenAI API key is not configured'));
    }

    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides information about taxes, government spending, and financial matters. Keep your answers concise and informative."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length
      },
      timeout: 30000 // 30 seconds timeout
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
            if (parsedData.choices && parsedData.choices.length > 0 && parsedData.choices[0].message) {
              resolve(parsedData.choices[0].message.content);
            } else {
              reject(new Error('Invalid response format from OpenAI API'));
            }
          } catch (error) {
            console.error('Error parsing OpenAI response:', error);
            reject(new Error('Failed to parse OpenAI response'));
          }
        } else {
          try {
            const errorData = JSON.parse(responseData);
            const errorMessage = errorData.error?.message || 'Unknown error from OpenAI API';
            
            // Handle specific error types
            if (res.statusCode === 401) {
              reject(new Error('Authentication error: Invalid API key'));
            } else if (res.statusCode === 429) {
              reject(new Error('Rate limit exceeded: Too many requests'));
            } else {
              reject(new Error(`OpenAI API error (${res.statusCode}): ${errorMessage}`));
            }
          } catch (error) {
            reject(new Error(`OpenAI API error (${res.statusCode})`));
          }
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error making request to OpenAI:', error);
      reject(new Error('Network error when connecting to OpenAI API'));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request to OpenAI API timed out'));
    });

    req.write(data);
    req.end();
  });
}

// Test endpoint to check if the server is running and API key is configured
app.get('/api/test', (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'OpenAI API key is not configured' 
    });
  }
  
  res.json({ 
    status: 'ok', 
    message: 'Server is running and API key is configured',
    port: PORT
  });
});

// Handle OPTIONS requests for CORS preflight
app.options('/api/chat', (req, res) => {
  res.status(200).end();
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  console.log('Received request to /api/chat');
  
  // Check if API key is configured
  if (!OPENAI_API_KEY) {
    console.error('API key is not configured');
    return res.status(500).json({ 
      error: 'API_KEY_MISSING', 
      message: 'OpenAI API key is not configured. Please check server configuration.' 
    });
  }
  
  // Check if message is provided
  const { message } = req.body;
  if (!message) {
    console.error('No message provided in request');
    return res.status(400).json({ 
      error: 'MISSING_MESSAGE', 
      message: 'No message provided' 
    });
  }
  
  try {
    console.log('Sending message to OpenAI:', message);
    
    // Call OpenAI API directly
    const response = await callOpenAIDirectly(message);
    
    console.log('Received response from OpenAI');
    res.json({ message: response });
  } catch (error) {
    console.error('Error processing request:', error.message);
    
    // Handle specific error types
    if (error.message.includes('Invalid API key') || error.message.includes('Authentication error')) {
      return res.status(401).json({ 
        error: 'INVALID_API_KEY', 
        message: 'Invalid API key. Please check your OpenAI API key configuration.' 
      });
    } else if (error.message.includes('Rate limit') || error.message.includes('Too many requests')) {
      return res.status(429).json({ 
        error: 'RATE_LIMIT', 
        message: 'Rate limit exceeded. Please try again later.' 
      });
    } else if (error.message.includes('timed out')) {
      return res.status(504).json({ 
        error: 'TIMEOUT', 
        message: 'Request to OpenAI API timed out. Please try again later.' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: `An error occurred: ${error.message}` 
    });
  }
});

// Serve static files from the React app if build directory exists
if (buildExists) {
  app.use(express.static(buildPath));
  
  // For any request that doesn't match one above, send back React's index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // If build directory doesn't exist, return a helpful message
  app.get('*', (req, res) => {
    res.status(404).send(`
      <h1>Build directory not found</h1>
      <p>The React app build directory was not found. Please run 'npm run build' to create it.</p>
      <p>API endpoints are still available at:</p>
      <ul>
        <li><a href="/api/test">/api/test</a> - Test if the server is running</li>
        <li>/api/chat - Chat endpoint (POST request)</li>
      </ul>
    `);
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────┐
  │                                               │
  │   Tax Calculator Server running on port ${PORT}   │
  │                                               │
  │   - API endpoints:                            │
  │     * /api/test - Test endpoint               │
  │     * /api/chat - Chat endpoint               │
  │                                               │
  │   - OpenAI API key: ${OPENAI_API_KEY ? 'Configured ✓' : 'Not configured ✗'}        │
  │   - Build directory: ${buildExists ? 'Found ✓' : 'Not found ✗'}              │
  │                                               │
  └───────────────────────────────────────────────┘
  `);
}); 