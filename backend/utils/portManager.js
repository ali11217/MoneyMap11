const { exec } = require('child_process');
const net = require('net');

const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
      .once('error', err => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
};

const killProcess = (port) => {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`No process found on port ${port}`);
        resolve();
        return;
      }

      const killCommand = process.platform === 'win32'
        ? `taskkill /F /PID ${stdout.split('\n')[0].split(' ').filter(Boolean).pop()}`
        : `kill -9 ${stdout.trim()}`;

      exec(killCommand, (error) => {
        if (error) {
          console.error(`Failed to kill process on port ${port}`);
          reject(error);
        } else {
          console.log(`Successfully killed process on port ${port}`);
          resolve();
        }
      });
    });
  });
};

module.exports = { checkPort, killProcess };
