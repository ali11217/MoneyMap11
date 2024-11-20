const { killProcess } = require('../utils/portManager');

const PORT = process.env.PORT || 8081;

async function cleanup() {
  try {
    await killProcess(PORT);
    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup(); 