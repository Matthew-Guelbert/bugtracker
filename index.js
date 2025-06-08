import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import debug from 'debug';
const debugServer = debug('app:server');

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

