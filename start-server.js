const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying next port...`);
    port++;
    if (port > startPort + 10) {
      throw new Error('Could not find an available port after 10 attempts');
    }
  }
  return port;
}

// Function to update the .env file with the new port
function updateEnvFile(port) {
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update PORT in .env
    if (envContent.includes('PORT=')) {
      envContent = envContent.replace(/PORT=\d+/, `PORT=${port}`);
    } else {
      envContent += `\nPORT=${port}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`.env file updated with PORT=${port}`);
  } else {
    console.log('No .env file found, creating one');
    fs.writeFileSync(envPath, `PORT=${port}\n`);
  }
}

// Function to update the ChatBot.jsx file with the new port
function updateChatBotFile(port) {
  const chatBotPath = path.join(__dirname, 'src', 'components', 'ChatBot.jsx');
  
  if (fs.existsSync(chatBotPath)) {
    let chatBotContent = fs.readFileSync(chatBotPath, 'utf8');
    
    // Update all occurrences of localhost:3001 to localhost:${port}
    chatBotContent = chatBotContent.replace(/localhost:3001/g, `localhost:${port}`);
    
    fs.writeFileSync(chatBotPath, chatBotContent);
    console.log(`ChatBot.jsx updated to use port ${port}`);
  } else {
    console.log('ChatBot.jsx file not found');
  }
}

// Main function to start the server
async function startServer() {
  try {
    // Default port
    let port = 3001;
    
    // Check if the default port is in use
    if (await isPortInUse(port)) {
      console.log(`Port ${port} is already in use`);
      port = await findAvailablePort(port + 1);
      console.log(`Found available port: ${port}`);
      
      // Update configuration files
      updateEnvFile(port);
      updateChatBotFile(port);
    }
    
    console.log(`Starting server on port ${port}...`);
    
    // Start the server
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: port.toString() }
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Stopping server...');
      server.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

// Start the server
startServer(); 