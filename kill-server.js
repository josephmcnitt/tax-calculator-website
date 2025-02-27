const { exec } = require('child_process');
const os = require('os');

// Function to kill processes on a specific port
function killProcessOnPort(port) {
  console.log(`Attempting to kill processes on port ${port}...`);
  
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Windows command to find and kill process
    const findCommand = `netstat -ano | findstr :${port}`;
    
    exec(findCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error finding process: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
      }
      
      if (!stdout) {
        console.log(`No process found using port ${port}`);
        return;
      }
      
      // Parse the output to get PIDs
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4) {
          const pid = parts[4];
          pids.add(pid);
        }
      });
      
      if (pids.size === 0) {
        console.log(`No process found using port ${port}`);
        return;
      }
      
      // Kill each process
      pids.forEach(pid => {
        console.log(`Killing process with PID: ${pid}`);
        exec(`taskkill /F /PID ${pid}`, (killError, killStdout, killStderr) => {
          if (killError) {
            console.error(`Error killing process: ${killError.message}`);
            return;
          }
          
          if (killStderr) {
            console.error(`Error: ${killStderr}`);
            return;
          }
          
          console.log(`Process with PID ${pid} killed successfully`);
        });
      });
    });
  } else {
    // Unix/Linux/Mac command to find and kill process
    const findCommand = `lsof -i :${port} -t`;
    
    exec(findCommand, (error, stdout, stderr) => {
      if (error && !stdout) {
        console.error(`Error finding process: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
      }
      
      if (!stdout) {
        console.log(`No process found using port ${port}`);
        return;
      }
      
      // Parse the output to get PIDs
      const pids = stdout.split('\n').filter(pid => pid.trim() !== '');
      
      if (pids.length === 0) {
        console.log(`No process found using port ${port}`);
        return;
      }
      
      // Kill each process
      pids.forEach(pid => {
        console.log(`Killing process with PID: ${pid}`);
        exec(`kill -9 ${pid}`, (killError, killStdout, killStderr) => {
          if (killError) {
            console.error(`Error killing process: ${killError.message}`);
            return;
          }
          
          if (killStderr) {
            console.error(`Error: ${killStderr}`);
            return;
          }
          
          console.log(`Process with PID ${pid} killed successfully`);
        });
      });
    });
  }
}

// Kill processes on port 3001
killProcessOnPort(3001);

// Also check for any node processes that might be running the server
const isWindows = os.platform() === 'win32';

if (isWindows) {
  exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
    if (error || stderr) {
      console.error('Error checking for Node processes:', error || stderr);
      return;
    }
    
    console.log('Node processes currently running:');
    console.log(stdout);
    console.log('To kill a specific Node process, use: taskkill /F /PID <PID>');
  });
} else {
  exec('ps aux | grep node', (error, stdout, stderr) => {
    if (error) {
      console.error('Error checking for Node processes:', error);
      return;
    }
    
    console.log('Node processes currently running:');
    console.log(stdout);
    console.log('To kill a specific Node process, use: kill -9 <PID>');
  });
} 