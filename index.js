import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import debug from 'debug';
const debugServer = debug('app:server');

import { authMiddleware } from '@merlin4/express-auth';
import cookieParser from 'cookie-parser';

// built-in express middlewares
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
}

app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json
app.use(express.static('frontend/dist')); // serve static files from the frontend/dist directory

app.use(cors(corsOptions)); // enable CORS with options

app.use(cookieParser()); // parse cookies

app.use(authMiddleware(process.env.JWT_SECRET, 'authToken',{
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
}));

app.listen(port, () => {
  debugServer(`Server is running on port http://localhost:${port}`);
})

app.get('/', (req, res) => {
  res.send('Hello World TEST TEST TEST!');
});

// Catch-all route to serve index.html in the /frontend/dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
});

// Universal error handler
app.use((err, req, res, next) => {
  res.status(err.status).json({ error: err.message || 'Internal Server Error' });
});