const express = require("express");
require('dotenv').config();
const http = require("http");
const path = require('path');
const bcrypt = require("bcrypt");
const collection = require("./config.js"); 
const session = require("express-session");
const PORT = process.env.PORT;

const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

 app.use (session({
 secret : process.env.SESSION_SECRET, //to verify cookie's integrity
 resave: false, //controls force saving of session
 saveUninitialized: true //controls saving of uninitialized session
  }))
function requireLogin(req, res, next) {
  if (req.session.user) {
    next(); // User is logged in, proceed to the next middleware or route handler
  }
  else {  
    res.redirect('/login.html');
   }
   }


// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like index.html, index.js)
app.use(express.static(path.join(__dirname, '../client')));

app.get('/game', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/game.html'));
});
app.get ('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/about.html'));
})
app.get ('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
})
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/home.html'));
})

app.post("/register", async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({success: false, message: "Passwords donot match"});  //bad request
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  //this is the data to be inserted in the database
  const data = {
    name: username,
    password: hashedPassword
  };

  //check if user already exists
  const existingUser = await collection.findOne({ name: data.name });
  if (existingUser) {
    
    return res.status(400).json({success:false, message: "User already exists"});  //bad request
  }
  else{
     await collection.insertOne(data);
     return  res.status(201).json({success:true, message: "User registered successfully"});  //created response  
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Find user in the database
  const user = await collection .findOne({ name: username });
  if (!user) {
    return res.status(400).json({success: false, message: "User not found"});  //bad request
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({success: false, message: "Invalid password"});  //bad request
  }
  req.session.user = user.name; 
  res.json({success: true, message: "Login successful"});
})


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

  socket.on("hitTaken", ({ targetId, roomId,attackPower }) => {
  console.log(`Hit taken by ${targetId}`);

  // Notify the target that they got hit
  socket.to(targetId).emit("gotHit", { attackerId: socket.id, attackPower });

  // Also notify the attacker that their hit was successful
  socket.emit("hitSuccess", { targetId });
});

socket.on("playerDefeated", ({ roomId, defeatedId, winnerId }) => {
  console.log(`Player ${defeatedId} defeated by ${winnerId} in room ${roomId}`);

  // Notify all players in the room about the defeat
  io.to(roomId).emit("gameOver", { defeatedId, winnerId });

  // Optionally, you can remove the defeated player from the room
  if (rooms[roomId]) {
    delete rooms[roomId][defeatedId];
  }
})

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
