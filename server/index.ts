import { loadConfig } from './configService.js';
import { loadQuizzes } from './quizService.js';
import { createApp } from './app.js';
import { initializeAuthoringFolders } from './authoringService.js';

const PORT = 3001;

// Initialize server
async function startServer() {
  try {
    // Load config on startup
    const appConfig = await loadConfig();
    console.log(`\n✓ ${appConfig.appName} - Config loaded\n`);

    // Initialize authoring folders
    await initializeAuthoringFolders();

    // Load quizzes on startup
    const quizRegistry = await loadQuizzes(appConfig.quizFolder);

    // Create Express app with config and quiz registry
    const app = createApp(appConfig, quizRegistry);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/config`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
      console.log(`   Quizzes: http://localhost:${PORT}/api/quizzes`);
      console.log(`   Quiz by ID: http://localhost:${PORT}/api/quizzes/:id\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
