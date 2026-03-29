import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import debug from 'debug';
const debugServer = debug('app:server');

import { authMiddleware } from '@merlin4/express-auth';
import cookieParser from 'cookie-parser';

// built in express tools
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies to req.body
app.use(express.json()); // Parse JSON bodies to req.body
app.use(express.static('frontend/dist')); // Serve static files from the frontend/dist folder

app.use(cors(corsOptions));

app.use(cookieParser());

app.use(authMiddleware(process.env.JWT_SECRET, 'authToken', {
  httpOnly: true,
  maxAge: 1000 * 60 * 60,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}));

import { userRouter } from './routes/api/user.js';
import { bugRouter } from './routes/api/bug.js';
import { commentRouter } from './routes/api/comment.js';
import { testRouter } from './routes/api/test.js';

app.get('/', (req, res) => {
  res.status(200).send('BugTracker API is running.');
});

// API routes
app.use('/api/users', userRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/bugs', commentRouter);
app.use('/api/bugs', testRouter);

// Catch-all route to serve index.html in the /frontend/dist folder for React Router
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
});

// universal exception handler 
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start the server AFTER all routes are defined (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    debugServer(`Server is running on port http://localhost:${port}`);
  });
}

// Export the app for testing
export default app;