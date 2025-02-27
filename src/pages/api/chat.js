import OpenAI from 'openai';

// Initialize the OpenAI client with error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Set security headers
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://*.vercel.app https://*.openai.com https://api.openai.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;");
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if OpenAI client was initialized successfully
    if (!openai) {
      throw new Error('OpenAI client was not initialized properly');
    }

    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Log request details
    console.log('Chat API request received:', { 
      timestamp: new Date().toISOString(),
      messageLength: message.length,
      headers: req.headers
    });

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not defined');
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured',
        error: 'MISSING_API_KEY',
        details: 'The server is missing the OpenAI API key configuration'
      });
    }

    console.log('Sending request to OpenAI API...');
    const completion = await openai.chat.completions.create({
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
    });

    console.log('OpenAI API response received successfully');
    const responseMessage = completion.choices[0].message.content;
    return res.status(200).json({ 
      message: responseMessage,
      status: 'success'
    });
    
  } catch (error) {
    // Enhanced error logging
    console.error('Error in chat API:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      timestamp: new Date().toISOString(),
      statusCode: error.status || error.statusCode,
      headers: req.headers
    });

    // Determine error type and provide more specific error message
    let errorType = 'UNKNOWN_ERROR';
    let statusCode = 500;
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.message.includes('API key')) {
      errorType = 'API_KEY_ERROR';
      errorMessage = 'There was an issue with the OpenAI API key.';
    } else if (error.message.includes('rate limit') || error.status === 429) {
      errorType = 'RATE_LIMIT';
      statusCode = 429;
      errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      errorType = 'TIMEOUT';
      errorMessage = 'Request to OpenAI API timed out.';
    } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      errorType = 'NETWORK_ERROR';
      errorMessage = 'Network error while connecting to OpenAI API.';
    }

    res.status(statusCode).json({ 
      message: errorMessage,
      error: errorType,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 