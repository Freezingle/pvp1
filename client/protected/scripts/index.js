const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height =576;

let player = null;
let enableAttack = false;
let gameEnded = false;

roomId = new URLSearchParams(window.location.search).get("room");


function generateFramePath (folderPath, frameCount, filePrefix = "frame", extension = "png") {
  const frames = [];
  for (let i = 1; i <= frameCount; i++) {
    frames.push(`${folderPath}/${filePrefix}${i}.${extension}`);
  }
  return frames;
}

function generateRandomSpawn(playerWidth, playerHeight){
    const margin = 20; // Prevent spawning at the very edge
  const x = Math.floor(Math.random() * (canvas.width - playerWidth - margin * 2)) + margin;
    const y = canvas.height - playerHeight - 20; // spawn on ground
  return { x, y };
}

function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

const bgImagePaths  = generateFramePath("../assets/background/asian1",20);

   const background = new BackgroundSprite(bgImagePaths,100,canvas.width,canvas.height); 


function selectCharacter(type)
{
  const menu = document.getElementById("characterSelectMenu");
  menu.style.display  = "none";

  if (type === "bruiser") {
      spawn = generateRandomSpawn(80,100);

     player = new Bruiser (spawn.x,spawn.y, "green", 80,100, socket.id);
    }
    else if (type ==="assassin")
    {
      spawn = generateRandomSpawn(40,120);
       player = new Assassin  (spawn.x,spawn.y, "red", 40, 120, socket.id);
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
      attackPower: player.attackPower,
      hitPoints: player.hitPoints,
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
    otherPlayers[p.id] = {id: p.id, x: p.x, y: p.y, width:p.width, height:p.height, color: p.color, attackPower: p.attackPower, hitPoints: p.hitPoints };
  });
});

// New player joined
socket.on("newPlayer", (p) => {
  otherPlayers[p.id] = { id:p.id, x: p.x, y: p.y, width: p.width, height: p.height, color:p.color, attackPower: p.attackPower, hitPoints: p.hitPoints };
});


// Opponent moved
socket.on("opponentMove", (p) => {
  if (otherPlayers[p.id]) {
    otherPlayers[p.id].x = p.x;
    otherPlayers[p.id].y = p.y;
    
  }
});

socket.on("gameOver", ({ defeatedId, winnerId }) => {
 
  if (socket.id === winnerId) {
    alert("🎉 You Win!");
  } else {
    alert("💀 You Lose!");
  }
  gameEnded= true;

})

// Player left
socket.on("playerLeft", (id) => {
  delete otherPlayers[id];
});

socket.on("gotHit", ({ attackPower, attackerId }) => {
  console.log("You got hit by", attackerId);

  //call the gothit method here 
  player.gotHit(attackPower, attackerId);
});

socket.on("hitSuccess", ({ targetId }) => {
  console.log("You hit player2 with ID:", targetId);
});


loop();


}

// Control keys for moving local player
const keys = {};
//event listeners for keydown and keyup
window.addEventListener("keydown", (e) =>{if(gameEnded) return; keys[e.key.toLowerCase()] = true});
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
window.addEventListener("mousedown", (e)=>{ if( e.button === 0 && !gameEnded ) {enableAttack = true;}}); //leftclick


function update() {

  if (gameEnded) return; 
  player.move(keys);
  if (enableAttack) {
    player.attack(ctx);
   
    //for drrwing atk box in enemy side emit here

    
    enableAttack = false;  // reset attack state after attack
  }
  socket.emit("playerUpdate", { roomId, x: player.x, y: player.y });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //background drawing
  background.draw(ctx, performance.now());

  // Draw local player (with attack box if attacking)
  player.draw(ctx);

  // Draw other players (red)
  Object.values(otherPlayers).forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });

  // update attack box position
  Object.values(otherPlayers).forEach(p => {
    player.updateAttackDirection(p.x);
});
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}


