const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height =576;

let player = null;
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
    const margin = 20;
    const x = Math.floor(Math.random() * (canvas.width - playerWidth - margin * 2)) + margin;
    const y = canvas.height - playerHeight - 20;
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

const bgImagePaths = generateFramePath("../assets/background/asian1", 20);
const background = new BackgroundSprite(bgImagePaths, 100, canvas.width, canvas.height);

async function fetchUserInfo() {
  try {
    const res = await fetch("/api/userinfo");
    const data = await res.json();
    if (data.success === false) throw new Error(data.message);
    if (player) {
      player.username = data.name;
    }
  } catch (err) {
    console.error("Failed to fetch user info:", err.message);
  }
}

const otherPlayers = {}; // id -> player object

function selectCharacter(type) {
  const menu = document.getElementById("characterSelectMenu");
  menu.style.display = "none";

  if (type === "bruiser") {
    const spawn = generateRandomSpawn(80, 100);
    player = new Bruiser(spawn.x, spawn.y, "green", 80, 100, socket.id);
  } else if (type === "assassin") {
    const spawn = generateRandomSpawn(40, 120);
    player = new Assassin(spawn.x, spawn.y, "red", 40, 120, socket.id);
  }
  fetchUserInfo().then(startGame);
}

function startGame() {
  socket.emit("joinRoom", roomId, {
    id: socket.id,
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
    attackPower: player.attackPower,
    hitPoints: player.hitPoints,
    color: player.color,
    hitsLanded: player.hitsLanded,
    username: player.username || "Player"
  });

  socket.on("roomFull", (msg) => {
    alert(msg);
  });

  socket.on("currentPlayers", (players) => {
    players.forEach(p => {
      otherPlayers[p.id] = { ...p };
    });
  });

  socket.on("newPlayer", (p) => {
    otherPlayers[p.id] = { ...p };
  });

  socket.on("opponentMove", (p) => {
    if (otherPlayers[p.id]) {
      otherPlayers[p.id].x = p.x;
      otherPlayers[p.id].y = p.y;
      otherPlayers[p.id].hitsLanded = p.hitsLanded || 0;
    }
  });

  socket.on("gameOver", ({ defeatedId, winnerId }) => {
    gameEnded = true;
    const gameOverDiv = document.getElementById("gameOver");
    const resultText = document.getElementById("resultText");
    resultText.innerText = "Press any key !";

    if (socket.id === winnerId) {
      gameOverDiv.style.backgroundImage = "url('/assets/ui/win-bg.jpg')";
    } else {
      gameOverDiv.style.backgroundImage = "url('/assets/ui/lose-bg.jpg')";
    }

    gameOverDiv.style.display = "flex";
    window.addEventListener("keydown", () => {
      window.location.href = "/lobby.html";
    });
  });

  socket.on("playerLeft", (id) => {
    delete otherPlayers[id];
  });

  socket.on("gotHit", ({ attackPower, attackerId }) => {
    player.gotHit(attackPower, attackerId);
  });

  socket.on("hitSuccess", ({ targetId }) => {
    console.log("You hit player2 with ID:", targetId);
  });

  loop();
}

const keys = {};
let enableAttack = false;
let attackType = "basic";
let specialReady = false;

window.addEventListener("keydown", (e) => {
  if (gameEnded) return;
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (key === "e") {
    if (player.hitsLanded >= 5 && !player.specialActive) {
      attackType = "special";
      enableAttack = true;
      specialReady = true;
      player.hitsLanded = 0;
    }
  } else if (key === "c") {
    if (specialReady && player.specialActive) {
      player.special();
      specialReady = false;
    }
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", (e) => {
  if (e.button === 0 && !gameEnded) {
    attackType = "basic";
    enableAttack = true;
  }
});

function update() {
  if (gameEnded) return;

  player.move(keys);

  if (enableAttack) {
    player.attack(ctx, attackType);
    enableAttack = false;
  }

  socket.emit("playerUpdate", {
    roomId,
    x: player.x,
    y: player.y,
    hitsLanded: player.hitsLanded
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.draw(ctx, performance.now());
  player.draw(ctx);

  if (player.hitsLanded >= 5 && !player.specialActive) {
    ctx.font = "bold 26px 'Orbitron', sans-serif";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    ctx.fillText("SPECIAL", player.x + player.width / 2, player.y - 10);
  } else {
    ctx.font = "bold 16px 'Orbitron', sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(player.username || "You", player.x + player.width / 2, player.y - 10);
  }

  ctx.font = "20px Orbitron, monospace";
  ctx.fillStyle = "white";
  ctx.fillText(`Your Hits: ${player.hitsLanded}`, 20, 40);

  Object.values(otherPlayers).forEach((p, index) => {
    ctx.fillText(`Enemy Hits: ${p.hitsLanded || 0}`, 20, 70 + index * 30);
  });

  Object.values(otherPlayers).forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    ctx.font = "bold 16px 'Orbitron', sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(p.username || "Enemy", p.x + p.width / 2, p.y - 10);
  });

  Object.values(otherPlayers).forEach((p) => {
    player.updateAttackDirection(p.x);
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
