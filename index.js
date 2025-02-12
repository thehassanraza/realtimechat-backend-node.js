const express = require('express');
const db = require('./db/database.js');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./src/routes/userroute');
const authMiddleware = require('./src/middleware/authMiddleware');
const messageController = require('./src/controllers/messageController');

dotenv.config();
let socketid;

// Connect to MongoDB
db();

const app = express();
app.use(cors());
//body parsers
app.use(express.json()); // Add JSON body parser
app.use(express.urlencoded({ extended: true })); // Add URL-encoded body parser

// Routes
app.use('/api', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store online users
const onlineUsers = {};

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for 'join' event
  socket.on('join', (username) => {
    onlineUsers[username] = socket.id; 
    console.log(`${username} joined with socket ID: ${socket.id}`);
  });

  // Modified sendMessage handler
  socket.on('sendMessage', async (data) => {
    const { sender, recipient, message } = data;
    
    try {
      const savedMessage = await messageController.saveMessage(sender, recipient, message);
      console.log(`Message saved: ${savedMessage._id}`);
  
      // Prepare the message payload
      const messagePayload = {
        _id: savedMessage._id,
        sender: savedMessage.sender,
        message: savedMessage.message,
        timestamp: savedMessage.timestamp,
        isMe: false // This will help the frontend distinguish messages
      };
  
      // Emit to recipient
      const recipientSocketId = onlineUsers[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', messagePayload);
      }
  
      // Also emit back to sender for confirmation
      const senderSocketId = onlineUsers[sender];
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageSent', {
          ...messagePayload,
          isMe: true
        });
      }
  
    } catch (error) {
      console.error('Error handling message:', error);
      // Send error back to sender
      const senderSocketId = onlineUsers[sender];
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageError', {
          error: 'Failed to send message'
        });
      }
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove user from onlineUsers
    const disconnectedUser = Object.keys(onlineUsers).find(
      (user) => onlineUsers[user] === socket.id
    );
    if (disconnectedUser) {
      delete onlineUsers[disconnectedUser];
      console.log(`${disconnectedUser} left the chat`);
    }
  });
});

// Start the server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});