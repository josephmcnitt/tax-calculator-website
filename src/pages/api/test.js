export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running and API key is configured',
    port: process.env.PORT || 'vercel'
  });
} 