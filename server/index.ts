import express from 'express';
import cors from 'cors';
import { loadConfig } from './configService.js';
import type { AppConfig } from '../src/config/types.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store config in memory (will be loaded on startup)
let appConfig: AppConfig;

// API Routes

/**
 * GET /api/config
 * Returns the application configuration
 */
app.get('/api/config', (req, res) => {
  res.json(appConfig);
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize server
async function startServer() {
  try {
    // Load config on startup
    appConfig = await loadConfig();
    console.log(`\n✓ ${appConfig.appName} - Config loaded\n`);

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
