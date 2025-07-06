const express = require("express");
require('dotenv').config();
const http = require("http");
const path = require('path');
const bcrypt = require("bcrypt");
const collection = require("./config.js");
const session = require("express-session");
const PORT = process.env.PORT || 3000;

const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

function requireLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    // Redirect to login page if not authenticated
    res.redirect('/login');
  }
}

// Parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === STATIC FILES ===

// Serve public assets (CSS, JS, images for public pages)
app.use('/styles', express.static(path.join(__dirname, '../client/public/styles')));
app.use('/scripts', express.static(path.join(__dirname, '../client/public/scripts')));
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));  // your images etc.

// Serve all other public static files (HTML files in public)
app.use(express.static(path.join(__dirname, '../client/public')));

// === PROTECTED STATIC FILES ===
// Serve protected CSS & JS only if logged in
app.get('/protected/styles/:file', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, `../client/protected/styles/${req.params.file}`));
});
app.get('/protected/scripts/:file', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, `../client/protected/scripts/${req.params.file}`));
});

// === ROUTES ===

// Public HTML pages (no login required)
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/about.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/login.html'));
});
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Protected HTML pages (require login)
app.get('/game.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/protected/game.html'));
});
app.get('/lobby.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/protected/lobby.html'));
});

// === AUTH ===

// Registration
app.post("/register", async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const data = { name: username, password: hashedPassword };

  const existingUser = await collection.findOne({ name: data.name });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }
  await collection.insertOne(data);
  return res.status(201).json({ success: true, message: "User registered successfully" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await collection.findOne({ name: username });
  if (!user) {
    return res.status(400).json({ success: false, message: "User not found" });
  }
  if(user.isLoggedIn){
    return res.status(400).json({success: false, message: "User already logged in"});
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ success: false, message: "Invalid password" });
  }
  //setting login to true 
  await collection.updateOne({name:username}, {$set:{isLoggedIn:true}});
  req.session.user = user.name;
  res.json({ success: true, message: "Login successful" });
});

app.post("/logout", requireLogin, async (req, res) => {
  await collection.updateOne({ name: req.session.user }, { $set: { isLoggedIn: false } });
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

// ===API===
app.get('/api/userinfo', requireLogin, async(req,res)=>{
  const user = await collection.findOne({name:req.session.user});
  if(!user)
  {
    return res.status(404).json({success:false, message:"User not found"});
  }
  res.json({
    name: user.name,
    tokens:user.tokens,
    xpLevel: user.xpLevel,
    gamesPlayed: user.gamesPlayed,
    wins: user.wins
  });
});




// === SOCKET.IO ===

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId, player) => {
    if (!rooms[roomId]) rooms[roomId] = {};

    if (Object.keys(rooms[roomId]).length >= 2) {
      socket.emit("roomFull", "Room is full");
      return;
    }

    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    rooms[roomId][socket.id] = player;

    const otherPlayers = Object.entries(rooms[roomId])
      .filter(([id]) => id !== socket.id)
      .map(([id, data]) => ({ id, ...data }));

    socket.emit("currentPlayers", otherPlayers);
    socket.to(roomId).emit("newPlayer", { id: socket.id, ...player });
  });

  socket.on("playerUpdate", ({ roomId, x, y, hitsLanded }) => {
    if (rooms[roomId] && rooms[roomId][socket.id]) {
      rooms[roomId][socket.id].x = x;
      rooms[roomId][socket.id].y = y;
      rooms[roomId][socket.id].hitsLanded = hitsLanded;

      io.to(roomId).emit("opponentMove", { id: socket.id, x, y, hitsLanded });
    }
  });

  socket.on("hitTaken", ({ targetId, roomId, attackPower }) => {
    console.log(`Hit taken by ${targetId}`);
    socket.to(targetId).emit("gotHit", { attackerId: socket.id, attackPower });
    socket.emit("hitSuccess", { targetId });
  });

  socket.on("playerDefeated", ({ roomId, defeatedId, winnerId }) => {
    console.log(`Player ${defeatedId} defeated by ${winnerId} in room ${roomId}`);
    io.to(roomId).emit("gameOver", { defeatedId, winnerId });
    if (rooms[roomId]) {
      delete rooms[roomId][defeatedId];
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      if (rooms[roomId][socket.id]) {
        delete rooms[roomId][socket.id];
        socket.to(roomId).emit("playerLeft", socket.id);
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
