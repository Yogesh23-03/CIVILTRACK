const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectToDB=require('./config/db')
const voiceComplaintsRouter = require('./routes/voiceComplaints');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://civiltrack-frontend.onrender.com",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
connectToDB()

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 New client connected');
  
  socket.on('join-ward', (ward) => {
    socket.join(`ward-${ward}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected');
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/users', require('./routes/users'));
app.use('/api/public', require('./routes/public'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/import', require('./routes/import'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/call-complaints', require('./routes/callComplaints'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/voice-complaints', voiceComplaintsRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'CivicTrack API Running 🚀' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
