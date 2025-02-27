export default function handler(req, res) {
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

  // Log request details
  console.log('Test API request received:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    userAgent: req.headers['user-agent']
  });

  // Check if OpenAI API key is configured
  const apiKeyConfigured = !!process.env.OPENAI_API_KEY;
  
  // Get environment information
  const environment = {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    region: process.env.VERCEL_REGION || 'unknown',
    isVercel: !!process.env.VERCEL || false
  };

  res.status(200).json({ 
    status: 'ok', 
    message: apiKeyConfigured ? 'Server is running and API key is configured' : 'Server is running but API key is missing',
    apiKeyConfigured: apiKeyConfigured,
    timestamp: new Date().toISOString(),
    environment: environment,
    headers: {
      received: {
        origin: req.headers.origin || 'none',
        referer: req.headers.referer || 'none',
        userAgent: req.headers['user-agent'] || 'none'
      },
      sent: {
        cors: {
          allowOrigin: res.getHeader('Access-Control-Allow-Origin'),
          allowMethods: res.getHeader('Access-Control-Allow-Methods'),
          allowCredentials: res.getHeader('Access-Control-Allow-Credentials')
        }
      }
    }
  });
} 