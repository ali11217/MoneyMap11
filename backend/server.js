require('dotenv').config();
const express = require('express');
const path = require('path');

const connectDB = require('./config/db');
const cors = require('cors');
const { checkPort, killProcess } = require('./utils/portManager');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/profile-pictures', express.static(path.join(__dirname, 'uploads/profile-pictures')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/savings-goals', require('./routes/savingsGoals'));

const PORT = process.env.PORT || 8081;

const startServer = async () => {
  try {
    const isPortAvailable = await checkPort(PORT);
    
    if (!isPortAvailable) {
      console.log(`Port ${PORT} is in use. Attempting to free it...`);
      await killProcess(PORT);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 