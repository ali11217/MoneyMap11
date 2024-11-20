const { exec } = require('child_process');
const { killProcess } = require('../utils/portManager');

const PORT = process.env.PORT || 8081;

async function start() {
  try {
    // Kill any existing process on the port
    await killProcess(PORT);
    
    // Start the server
    const server = exec('node server.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      console.log(stdout);
      console.error(stderr);
    });

    server.stdout.pipe(process.stdout);
    server.stderr.pipe(process.stderr);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start(); 