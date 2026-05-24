import fs from 'fs';
import path from 'path';
import { env } from './config/env';
import app from './app';
import { startCronJobs } from './services/cron';

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀 Skillyme LMS Server running on port ${env.PORT}`);
  console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  startCronJobs();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});

export default server;
