const dotenv = require('dotenv');
dotenv.config(); // ← must be first before anything else

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route File Imports
const authRoutes = require('./routes/authRoutes');
const syllabusRoutes = require('./routes/syllabusRoutes');
const adminRoutes = require('./routes/adminRoutes');
const headmasterRoutes = require('./routes/headmasterRoutes');
const hodRoutes = require('./routes/hodRoutes');

// Establish core connection link with MongoDB instance
connectDB();

const app = express();

// Global Middleware Configuration Setup
app.use(cors());
app.use(express.json());

// Main Application Endpoint Route Mapping Setup
app.use('/api/auth', authRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/headmaster', headmasterRoutes);
app.use('/api/hod', hodRoutes);

// Catch-All Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`Unhandled Exception Stack Trace: ${err.stack}`);
    res.status(500).json({
        success: false,
        message: 'A critical server error occurred. Please contact the platform admin.',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`🌐 API Gateway Entry: http://${process.env.HOST || 'localhost'}:${PORT}`);
    console.log(`=============================================`);
});
