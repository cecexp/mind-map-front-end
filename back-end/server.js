require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/database');
const { helmetConfig, corsConfig, sanitizeInput, apiLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmetConfig);
app.use(cors(corsConfig)); // ✅ Aplica CORS globalmente
app.options('*', cors(corsConfig)); // ✅ Maneja preflight (OPTIONS)
app.use(apiLimiter);
app.use(sanitizeInput);

// Session middleware for 2FA temporary storage
app.use(session({
    secret: process.env.SESSION_SECRET || 'mindmap_session_secret_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/maps', require('./routes/maps'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Mind Map API is running!',
        timestamp: new Date().toISOString()
    });
});

// Handle 404 errors
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Mind Map API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗺️  Maps API: http://localhost:${PORT}/api/maps`);
});

// Export the app for Vercel
module.exports = app;