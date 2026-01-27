const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const debug = require('debug')('app:server');

const connectDB = require('./config/db.config');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { limiter } = require('./middlewares/rateLimit.middleware');
const v1Router = require('./api/v1/index.routes');

const app = express();
debug('Express app initialized.');

connectDB();
console.log("MIDDLEWARE LOAD ORDER CHECK START");

app.use(helmet());
console.log("Helmet loaded");
app.use(limiter);
console.log("Limiter loaded");
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];
console.log("CORS loaded");
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
console.log("express.json loaded");
app.use(express.urlencoded({ extended: true }));
console.log("URL Encoded loaded");
app.use(compression());

console.log("Middleware loaded. Mounting routes...");

app.get("/speed", (req, res) => {
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AI ChatApp Server is running smoothly!',
    version: 'v1'
  });
});

app.use('/api/v1', v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
