import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import referencesRouter from './routes/references.js';
import creditsRouter from './routes/credits.js';
import stripeRouter from './routes/stripe.js';

const app = express();

// CORS
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body for signature verification
// Register BEFORE the JSON body parser
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api', referencesRouter);
app.use('/api', creditsRouter);
app.use('/api', stripeRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
