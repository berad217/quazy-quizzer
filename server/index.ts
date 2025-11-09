import { loadConfig } from './configService.js';
import { createApp } from './app.js';

const PORT = 3001;

// Initialize server
async function startServer() {
  try {
    // Load config on startup
    const appConfig = await loadConfig();
    console.log(`\n✓ ${appConfig.appName} - Config loaded\n`);

    // Create Express app with config
    const app = createApp(appConfig);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/config`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
