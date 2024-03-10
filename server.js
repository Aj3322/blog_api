// Required modules
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require("xss-clean");
const mongoSanitize = require('express-mongo-sanitize');

// Custom modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const routes = require('./router/routes');
const userRoutes = require('./router/userRoutes');

// Initialize Express app
const app = express();

// Global middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Limit request from the same IP
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 mins
    max: 100, // limit each IP to 100 requests per window Ms
    message: {
        status: 'Too many requests',
        message: 'Too many requests to the same IP address. Please try again after 1 hr.'
    }
});

app.use('/api', limiter);

// Protect against XSS attacks by sanitizing data
app.use((req, res, next) => {
    req.body = xss(req.body);
    next();
});

// Routes
app.get('/', (req, res) => {
    const now = req.requestTime;
    return res.send(`<h1>Welcome to our API</h1><p>Request Time: ${now}</p>`);
});

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use('/', routes);
app.use('/', userRoutes);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
