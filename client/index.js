const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height =576;
const roomId = "room1"; // static for demo

let player = null;
let enableAttack = false;

function selectCharacter(type)
{
  const menu = document.getElementById("characterSelectMenu");
  menu.style.display  = "none";

  if (type === "bruiser") {
     player = new Bruiser (0,0, "green", 80,100, socket.id);
    }
    else if (type ==="assassin")
    {
       player = new Assassin  (0,0, "red", 40, 120, socket.id);
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
      width: player.width,
      height: player.height,
      
      color: player.color
    }
  );
  //room  is full 
  socket.on("roomFull", (msg) => {
  alert(msg); // Or display the message in your UI
});

// Receive current players already in room
socket.on("currentPlayers", (players) => {
  players.forEach(p => {
    otherPlayers[p.id] = { x: p.x, y: p.y, width:p.width, height:p.height, color: p.color };
  });
});

// New player joined
socket.on("newPlayer", (p) => {
  otherPlayers[p.id] = { x: p.x, y: p.y, width: p.width, height: p.height, color:p.color };
});


// Opponent moved
socket.on("opponentMove", (p) => {
  if (otherPlayers[p.id]) {
    otherPlayers[p.id].x = p.x;
    otherPlayers[p.id].y = p.y;
    console.log("im inside opponent move");
    console.log(`Opponent ${otherPlayers[p.id].width}`);
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
//event listeners for keydown and keyup
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
window.addEventListener("mousedown", (e)=>{ if( e.button === 0) {enableAttack = true;}}); //leftclick


//tthis is going to shift to classes.js later or  maybe im just going tto call the method here !
function update() {
 player.move(keys);
  if (enableAttack) {
    player.attack(ctx);
    enableAttack = false;  // reset attack state after attack
    // reset attack state
  }
  // Send local player position to server
  socket.emit("playerUpdate", { roomId, x: player.x, y: player.y });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw local player (with attack box if attacking)
  player.draw(ctx);

  // Draw other players (red)
  Object.values(otherPlayers).forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });

  // update attack box position
  Object.values(otherPlayers).forEach(p => {
    if(player.x > p.x + p.width )
      player.attackBox.offsetDirection = -1; // left
    else 
    player.attackBox.offsetDirection = 1; // right
});
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

