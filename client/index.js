const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height =576;
const roomId = "room1"; // static for demo

let player = null;

function selectCharacter(type)
{
  const menu = document.getElementById("characterSelectMenu");
  menu.style.display  = "none";

  if (type === "bruiser") {
     player = new Bruiser (0,0, "green", socket.id);
    }
    else if (type ==="assassin")
    {
       player = new Assassin  (0,0, "red", socket.id);
    }
    startGame();

}


// Local player state
//const player = { x: 50, y: 300, color: "blue", id: null };
const otherPlayers = {}; // id -> {x, y, color}

function startGame (){
  socket.emit("joinRoom", roomId,
     {
      id:socket.id,
      x: player.x,
      y:player.y,
      type: player.type,
      color: player.color
    }
  );

// Receive current players already in room
socket.on("currentPlayers", (players) => {
  players.forEach(p => {
    otherPlayers[p.id] = { x: p.x, y: p.y, color: p.color };
  });
});

// New player joined
socket.on("newPlayer", (p) => {
  otherPlayers[p.id] = { x: p.x, y: p.y, color:p.color };
});

// Opponent moved
socket.on("opponentMove", (p) => {
  if (otherPlayers[p.id]) {
    otherPlayers[p.id].x = p.x;
    otherPlayers[p.id].y = p.y;
  }
});

// Player left
socket.on("playerLeft", (id) => {
  delete otherPlayers[id];
});

loop();


}

// Control keys for moving local player
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);


//tthis is going to shift to classes.js later or  maybe im just going tto call the method here !
function update() {
 player.move(keys);

  // Send local player position to server
  socket.emit("playerUpdate", { roomId, x: player.x, y: player.y });
}

function draw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw local player (blue)
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, 50, 50);

  // Draw other players (red)
  Object.values(otherPlayers).forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 50, 50);
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

