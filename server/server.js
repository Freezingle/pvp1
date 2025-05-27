const express = require("express");
const http = require("http");
const path = require('path');

const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Serve static files (like index.html, index.js)
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});


// Keep track of rooms and players (simple version)
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  
socket.on("joinRoom", (roomId, player) => {
  // Create room if not exists
  if (!rooms[roomId]) rooms[roomId] = {};

  // Check if room is full
  if (Object.keys(rooms[roomId]).length >= 2) {
    socket.emit("roomFull", "Room is full");
    return;
  }

  socket.join(roomId);
  console.log(`${socket.id} joined room ${roomId}`);

  rooms[roomId][socket.id] = player;  // initial position

    // Send all players in room to this socket (except self)
    const otherPlayers = Object.entries(rooms[roomId])
      .filter(([id]) => id !== socket.id)
      .map(([id, data]) => ({ id, ...data }));

    socket.emit("currentPlayers", otherPlayers);

    // Notify others that this player joined
      

    socket.to(roomId).emit("newPlayer", { id: socket.id, ...player});
  });

  socket.on("playerUpdate", ({ roomId, x, y }) => {
    if (rooms[roomId] && rooms[roomId][socket.id]) {
      rooms[roomId][socket.id].x = x;
      rooms[roomId][socket.id].y = y;

      // Broadcast updated position to others
      io.to(roomId).emit("opponentMove", { id: socket.id, x, y });
    }
  });

  socket.on("hitTaken", ({ targetId, roomId }) => {
  console.log(`Hit taken by ${targetId}`);

  // Notify the target that they got hit
  socket.to(targetId).emit("gotHit", { attackerId: socket.id });

  // Also notify the attacker that their hit was successful
  socket.emit("hitSuccess", { targetId });
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove player from rooms and notify others
    for (const roomId in rooms) {
      if (rooms[roomId][socket.id]) {
        delete rooms[roomId][socket.id];
        socket.to(roomId).emit("playerLeft", socket.id);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
