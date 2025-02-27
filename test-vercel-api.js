const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.TEST_PORT || 3002;

// Configure CORS
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running and API key is configured',
    port: PORT
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not defined');
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }

    const completion = await openai.createChatCompletion({
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

    const responseMessage = completion.data.choices[0].message.content;
    return res.status(200).json({ message: responseMessage });
    
  } catch (error) {
    console.error('Error in chat API:', error.message);
    res.status(500).json({ 
      message: 'An error occurred while processing your request.',
      error: error.message
    });
  }
});

// Serve static files from the build directory
app.use(express.static('build'));

// Serve the test HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/test-vercel.html');
});

// Start the server
app.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────┐
  │                                               │
  │   Test Vercel API Server running on port ${PORT}   │
  │                                               │
  │   - API endpoints:                            │
  │     * /api/test - Test endpoint               │
  │     * /api/chat - Chat endpoint               │
  │                                               │
  │   - OpenAI API key: ${process.env.OPENAI_API_KEY ? 'Configured ✓' : 'Not configured ✗'}        │
  │                                               │
  └───────────────────────────────────────────────┘
  `);
}); 