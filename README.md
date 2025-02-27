# Tax Calculator Website with ChatBot

This is a tax calculator website with an integrated ChatBot that can answer tax-related questions.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```
   Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Running the Application

You can run the application in development mode with:

```
npm run dev
```

This will start both the React frontend and the Express backend server concurrently.

Alternatively, you can run them separately:

- Frontend: `npm start` (runs on port 3000)
- Backend: `npm run server` (runs on port 3001)

## Building for Production

To build the application for production:

```
npm run build
```

Then you can serve the production build with:

```
npm run server
```

## Features

- Tax Calculator
- ChatBot for answering tax-related questions
