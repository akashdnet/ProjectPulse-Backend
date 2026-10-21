import dotenv from 'dotenv';
dotenv.config();

import { Server } from 'http';
import app from './app';

const PORT = process.env.PORT || 5000;

let server: Server;

async function bootstrap() {
  try {
    server = app.listen(PORT, () => {
      console.log(`🚀 Application is running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log('Server closed gracefully.');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.error('Unexpected error encountered:', error);
    exitHandler();
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully.');
    if (server) {
      server.close();
    }
  });
}

bootstrap();
