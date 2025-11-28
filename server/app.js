// 1. Core Imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const debug = require('debug')('app:server');

// 2. Custom Imports
const connectDB = require('./config/db.config');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { limiter } = require('./middlewares/rateLimit.middleware');
const v1Router = require('./api/v1/index.routes');

// Initialize App
const app = express();
debug('Express app initialized.');

// 3. Connect Database
connectDB();

// 4. Global Middleware
app.use(helmet());
app.use(limiter);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];



app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// 5. Routes
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'AI ChatApp Server is running smoothly!',
    version: 'v1'
  });
});

app.use('/api/v1', v1Router);

// 6. Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ❌ REMOVE app.listen() from here
// Export app so server.js can use it
module.exports = app;
