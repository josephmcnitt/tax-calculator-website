# Tax Calculator Website

A web application that provides tax information and calculations through a chatbot interface powered by OpenAI's API.

## Features

- Interactive chatbot for tax-related questions
- Real-time responses using OpenAI's GPT model
- Responsive design for desktop and mobile
- Server status indicator
- Automatic retry mechanism for rate-limited requests
- Automatic port selection if default port is in use

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- OpenAI API key

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tax-calculator-website.git
   cd tax-calculator-website
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

4. Build the React application:
   ```
   npm run build
   ```

## Running the Application

### Using the Batch File (Windows)

Simply run the batch file to start the server:
```
start-server.bat
```

This will:
1. Kill any existing processes on port 3001
2. Start the server with automatic port selection
3. Update the frontend to use the selected port

### Manual Start

1. Kill any existing server processes (optional):
   ```
   node kill-server.js
   ```

2. Start the server with automatic port selection:
   ```
   node start-server.js
   ```

3. In a separate terminal, start the React development server (optional, for development only):
   ```
   npm start
   ```

## Deploying to Vercel

This application is configured to work with Vercel deployment:

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the application:
   ```
   vercel
   ```

4. Set up environment variables in the Vercel dashboard:
   - Go to your project settings
   - Add the `OPENAI_API_KEY` environment variable with your OpenAI API key

5. For production deployment:
   ```
   vercel --prod
   ```

## Troubleshooting

### "Failed to fetch" Error

If you encounter a "Failed to fetch" error in the chatbot:

1. Check if the server is running
2. Verify your OpenAI API key is valid and properly formatted
3. Look for any error messages in the server console
4. Try restarting the server using the batch file

### Port Already in Use

If port 3001 is already in use:

1. Use the `start-server.js` script which will automatically find an available port
2. Or manually change the PORT in your .env file

### API Key Issues

If you're having issues with the OpenAI API key:

1. Make sure the key is correctly formatted in the .env file
2. Check that the key is valid and has not expired
3. Verify you have sufficient credits in your OpenAI account

### Vercel Deployment Issues

If you're having issues with Vercel deployment:

1. Check that your OpenAI API key is correctly set in the Vercel environment variables
2. Verify that the API routes are properly configured
3. Check the Vercel deployment logs for any errors

## Project Structure

- `server.js` - Express server that handles API requests (for local development)
- `src/` - React frontend source code
- `src/components/ChatBot.jsx` - Chatbot component
- `src/pages/api/` - API routes for Vercel deployment
- `start-server.js` - Script to start the server with automatic port selection (local only)
- `kill-server.js` - Script to kill processes on port 3001 (local only)
- `vercel.json` - Configuration for Vercel deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the API
- React for the frontend framework
- Express for the backend server
- Vercel for hosting
