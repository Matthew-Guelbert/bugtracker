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

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
}

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies to req.body
app.use(express.json()); // Parse JSON bodies to req.body
app.use(express.static('frontend/dist')); // Serve static files from the frontend/dist folder

app.use(cors(corsOptions));

app.use(cookieParser());

app.use(authMiddleware(process.env.JWT_SECRET, 'authToken', {
  httpOnly: true,
  maxAge: 1000 * 60 * 60,
}));

import { userRouter } from './routes/api/user.js';
import { bugRouter } from './routes/api/bug.js';
import { commentRouter } from './routes/api/comment.js';
import { testRouter } from './routes/api/test.js';

app.listen(port, () => {
  debugServer(`Server is running on port http://localhost:${port}`);
})

app.get('/', (req, res) => {
  res.send('Hello World TEST TEST TEST!');
});

// Catch-all route to serve index.html in the /frontend/dist folder for React Router
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/api/users', userRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/bugs', commentRouter);
app.use('/api/bugs', testRouter);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
});

// universal exception handler 
app.use((err, req, res, next) => {
  res.status(err.status).json({ error: err.message});
});