import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import router from './routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import requestLogger from './app/middlewares/requestLogger';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request & Route Hit Logger
app.use(requestLogger);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ProjectPulse - Project Submission & Review API!',
  });
});

// Application v1 routes
app.use('/api/v1', router);

// Not found handler
app.use((req: Request, res: Response) => {
  console.warn(`⚠️ [NOT FOUND 404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API Not Found',
    errorDetails: [
      {
        path: req.originalUrl,
        message: `The requested path '${req.originalUrl}' does not exist on this server.`,
      },
    ],
  });
});

// Global error handler
app.use(globalErrorHandler);

export default app;
