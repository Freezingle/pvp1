// index.js (rewritten to support actual class instances for opponents)

const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

let player = null;
let gameEnded = false;

roomId = new URLSearchParams(window.location.search).get("room");

function generateFramePath(folderPath, frameCount, filePrefix = "frame", extension = "png") {
  const frames = [];
  for (let i = 1; i <= frameCount; i++) {
    frames.push(`${folderPath}/${filePrefix}${i}.${extension}`);
  }
  return frames;
}

function generateRandomSpawn(playerWidth, playerHeight) {
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

const otherPlayers = {}; // id -> Character/Bruiser/Assassin instance

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
    username: player.username || "Player",
    type: player.type
  });

  socket.on("roomFull", (msg) => {
    alert(msg);
  });

  socket.on("currentPlayers", (players) => {
    players.forEach(p => {
      if (p.id !== socket.id) {
        createOpponentInstance(p);
      }
    });
  });

  socket.on("newPlayer", (p) => {
    if (p.id !== socket.id) {
      createOpponentInstance(p);
    }
  });

  socket.on("opponentMove", (p) => {
    const opponent = otherPlayers[p.id];
    if (opponent) {
      opponent.x = p.x;
      opponent.y = p.y;
      opponent.hitsLanded = p.hitsLanded || 0;
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

function createOpponentInstance(p) {
  let opponent;
  if (p.type === "bruiser") {
    opponent = new Bruiser(p.x, p.y, p.color, p.width, p.height, p.id);
  } else if (p.type === "assassin") {
    opponent = new Assassin(p.x, p.y, p.color, p.width, p.height, p.id);
  } else {
    opponent = new Character(p.x, p.y, p.color, p.width, p.height, p.id);
  }
  opponent.username = p.username;
  opponent.hitsLanded = p.hitsLanded;
  opponent.hitPoints = p.hitPoints;
  otherPlayers[p.id] = opponent;
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
      player.hitsLanded = 0;
      enableAttack = true;
      specialReady = true;
      
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

function drawBar(ctx, x, y, width, height, percent, bgColor, fillColor) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, width * percent, height);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.draw(ctx, performance.now());
  player.draw(ctx);

  const barWidth = 80;
  const barHeight = 6;
  const barGap = 4;
  const textGap = 18;

  ctx.font = "bold 16px 'Orbitron', sans-serif";
  ctx.fillStyle = player.hitsLanded >= 5 && !player.specialActive ? "gold" : "white";
  ctx.textAlign = "center";
  ctx.fillText(
    player.hitsLanded >= 5 && !player.specialActive ? "SPECIAL" : (player.username || "You"),
    player.x + player.width / 2,
    player.y - textGap
  );

  const playerBarX = player.x + player.width / 2 - barWidth / 2;
  const playerBarY = player.y - textGap - barGap - barHeight * 2;

  drawBar(ctx, playerBarX, playerBarY, barWidth, barHeight, player.hitPoints / player.maxHp, "#333", "limegreen");
  drawBar(ctx, playerBarX, playerBarY + barHeight + barGap, barWidth, barHeight, player.stamina / player.maxStamina, "#333", "gold");

  ctx.font = "20px Orbitron, monospace";
  ctx.fillStyle = "white";
  ctx.textAlign = "start";
  ctx.fillText(`Your Hits: ${player.hitsLanded}`, 20, 40);

  Object.values(otherPlayers).forEach((opponent, index) => {
    opponent.draw(ctx);

    ctx.font = "bold 16px 'Orbitron', sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(opponent.username || "Enemy", opponent.x + opponent.width / 2, opponent.y - textGap);

    const enemyBarX = opponent.x + opponent.width / 2 - barWidth / 2;
    const enemyBarY = opponent.y - textGap - barGap - barHeight * 2;

    drawBar(ctx, enemyBarX, enemyBarY, barWidth, barHeight, opponent.hitPoints / opponent.maxHp, "#333", "limegreen");
    drawBar(ctx, enemyBarX, enemyBarY + barHeight + barGap, barWidth, barHeight, opponent.stamina / opponent.maxStamina, "#333", "gold");

    ctx.font = "16px Orbitron, monospace";
    ctx.textAlign = "start";
    ctx.fillText(`Enemy Hits: ${opponent.hitsLanded || 0}`, 20, 70 + index * 30);
  });

  Object.values(otherPlayers).forEach((opponent) => {
    player.updateAttackDirection(opponent.x);
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}