const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testApi() {
  try {
    console.log('Testing API endpoint...');
    
    // Test the test endpoint
    console.log('Testing /api/test endpoint...');
    const testResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/test',
      method: 'GET'
    });
    console.log('Test endpoint response:', testResponse);
    
    // Test the chat endpoint
    console.log('\nTesting /api/chat endpoint...');
    const postData = JSON.stringify({ message: 'Hello, tell me about taxes' });
    const chatResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    console.log('Chat endpoint response:', chatResponse);
    
    console.log('\nAPI test completed.');
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi(); 