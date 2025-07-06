class Character {
    constructor(x, y, color, width, height, id) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.id = id;
        this.isAttacking = false;
        this.facingDirection = 1; // 1 = right, -1 = left
        this.hitPoints; // Default hit points
        this.gravity = 0.7;
        this.velocityY = 0; // Vertical velocity for gravity effect
        this.ground = canvas.height -10- this.height; // TODO make this dynamic
        this.specialActive = false;
        this.specialTimer = null;
        this.maxStamina = 100;
        this.stamina = this.maxStamina;
        this.staminaRegenRate  = 1 ;
        this.staminaDrainRate = 5;
        this.isDefending = false;
        this.defenceMultiplier= 0.4;
        this.hitsLanded=  0 ;


        this.attackBox = {
            position: { x: this.x, y: this.y },
            width: 0,
            height: 0,
            offsetY: 0,
            offsetX: this.width // will be negated if facing left
        };
    }

    updateAttackDirection(opponentX) {
        this.facingDirection = opponentX < this.x ? -1 : 1;
        this.attackBox.offsetX = this.facingDirection === 1 ? this.width : -this.attackBox.width;
    }
    updateStamina (){
      if(this.isDefending) {
        this.stamina = Math.max(0, this.stamina - this.staminaDrainRate); //this cant go negative!
        if (this.stamina === 0){
          this.stopDefend();
        }
        else{
          this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate); // Regenerate stamina
        }
      }
    }
    draw(ctx) {
      //character drawing
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        //attack box drawing
        if (
            this.isAttacking &&
            this.attackBox.width > 0 &&
            this.attackBox.height > 0 && !this.specialActive
        ) {
            this.attackBox.position.x = this.x;
            this.attackBox.position.y = this.y;

            ctx.fillStyle = "grey";
            ctx.fillRect(
                this.attackBox.position.x + this.attackBox.offsetX,
                this.attackBox.position.y + this.attackBox.offsetY,
                this.attackBox.width,
                this.attackBox.height
            );
        }
     else if (this.detonating && this.detonation) {
      console.log("im drrawing orange")
    ctx.fillStyle = "orange";
    ctx.fillRect(
        this.detonation.x,
        this.detonation.y,
        this.detonation.width,
        this.detonation.height
    );
}
        
    }

    gotHit(damage,attackerId) {
        this.hitPoints -= damage;
        console.log(`Character ${this.id} got hit by ${attackerId}. Remaining HP: ${this.hitPoints}`);
        if (this.hitPoints <= 0) {
            console.log(`Character ${this.id} has been defeated!`);

            //defeat sprite here

            // TODO notifying the server about defeat
            socket.emit("playerDefeated", {roomId, defeatedId: this.id, winnerId: attackerId})
        }
    }

    move(keys) {
       if (this.isDefending) {
  // reduce movement speed while defending
  if (keys['d']) this.x += this.speed * 0.4;
  if (keys['a']) this.x -= this.speed * 0.4;
  if (keys['s']) this.y += this.speed * 0.4;
} else {
  if (keys['d']) this.x += this.speed;
  if (keys['a']) this.x -= this.speed;
  if (keys['s']) this.y += this.speed;
}

         if (keys['w'] && this.y >= this.ground) {
        this.velocityY = -15;  //TODO ADJUST LATER
    }

        //gravityeffect
        this.velocityY += this.gravity;
        this.y += this.velocityY;
          if (this.y >= this.ground) {
            this.y = this.ground;
            this.velocityY = 0;
        }

        this.attackBox.position.x = this.x;
        this.attackBox.position.y = this.y;
    }
}

class Bruiser extends Character {
    constructor(x, y, color, width,height, id) {
        super(x, y, color, width,height, id);
        this.speed = 4; // Bruisers are slower
        this.type = "Bruiser";
        this.attackBox.width = 50; // Wider attack box
        this.attackBox.height = this.height; // Taller attack box
        this.punchPower = 20; // Higher attack power
        this.hitPoints = 350;
        this.maxHp = 350;
        this.detonation;
        this.detonating = false;
    }
    activateSpecial(){
      //temporary boosst
      this.speed= 8;
      this.specialActive = true;
       this.specialTimer = setTimeout(()=>{
        console.log("inside specialTimer")
        this.detonating = false;
    this.isAttacking = false;
    this.specialActive = false;
    this.speed= 4;
    this.detonation = null;
       },1000)
       }
      special(){
        console.log("Im in special 1st line");
        console.log("specialActive:", this.specialActive);
console.log("isAttacking:", this.isAttacking);
        if(!this.specialActive || !this.isAttacking) return;
        console.log("Bruiser special activated!");
          this.detonating = true;
          this.isAttacking = true;
const width = this.width * 3;   // Width of AoE (extends left & right)
const height = this.height * 2; // Height of AoE (extends up & down)

this.detonation = {
  x: this.x + this.width / 2 - width / 2,   // Centered horizontally
  y: this.y + this.height / 2 - height / 2, // Centered vertically
  width: width,
  height: height
};

        
      Object.values(otherPlayers).forEach(opponent => {
      const opponentRect = {
        id: opponent.id,
        x: opponent.x,
        y: opponent.y,
        width: opponent.width,
        height: opponent.height
      };
      console.log("Checking collision with opponent");
      if (isColliding(this.detonation, opponentRect)) {
      
        socket.emit("hitTaken", { targetId: opponent.id, roomId,  attackPower: 80 });
      }
    
    });
    clearTimeout(this.specialTimer);
    setTimeout(() => {
    console.log("Bruiser special ended");
    this.detonating = false;
    this.isAttacking = false;
    this.specialActive = false;
    this.speed= 4;
    this.detonation = null;
}, 300); 
       
          

        
      }


    attack (ctx, type){
        if (this.isAttacking) return; // Prevent multiple attacks at once
        this.isAttacking = true;
        if(type==="special"){
            this.activateSpecial();
            return;
        }
         else if (type!="basic") return;
      const atkBox = {
      x: this.attackBox.position.x + this.attackBox.offsetX,
      y: this.attackBox.position.y + this.attackBox.offsetY,
      width: this.attackBox.width,
      height: this.attackBox.height
    };
    Object.values(otherPlayers).forEach(opponent => {
      const opponentRect = {
        id: opponent.id,
        x: opponent.x,
        y: opponent.y,
        width: opponent.width,
        height: opponent.height
      };
      if (isColliding(atkBox, opponentRect)) {
        this.hitsLanded++;
        socket.emit("hitTaken", { targetId: opponent.id, roomId,  attackPower:  this.punchPower });
      }
    
    });
       
        console.log("Bruiser attacks with brute force!");

        //activate attack box here
    

        setTimeout(() => {
      this.isAttacking = false;
      console.log("Attack ended");

      // Deactivate attack box here
    }, 1000);
    }
  }

class Assassin extends Character {
    constructor(x, y, color, width, height, id) {
        super(x, y, color, width, height, id);
        this.speed = 10;
        this.type = "Assassin";
        this.attackBox.offsetY = 20;
        this.basic = 10;
        this.hitPoints = 160;
        this.dashPower;
        this.atkBox;
        // Dash special state
        this.dashAvailable = 0;
        this.maxHp = 160;
    }

    activateSpecial() {
        if (this.specialActive) return;
        this.specialActive = true;
        this.dashAvailable = 2;
        // End special after 5 seconds
        this.specialTimer = setTimeout(() => {
            this.specialActive = false;
            this.dashAvailable = 0;
        }, 5000);
    }

   special() {
    if (!this.specialActive || this.dashAvailable <= 0 || this.isDashing) return;

    this.isDashing = true;
    this.dashAvailable--;

    const startX = this.x;
    const endX = this.facingDirection === 1
        ? Math.min(canvas.width - this.width, this.x + 400)
        : Math.max(0, this.x - 400); // Dash only up to 400px to prevent offscreen

    const distance = endX - startX;
    const duration = 200; // ms
    const startTime = performance.now();

    const dashStep = (now) => {
        const elapsed = now - startTime;
        let progress = Math.min(elapsed / duration, 1);
        this.x = startX + distance * progress;

        // Check collisions on each frame
        Object.values(otherPlayers).forEach(opponent => {
            const opponentRect = {
                x: opponent.x,
                y: opponent.y,
                width: opponent.width,
                height: opponent.height
            };
            const assassinRect = {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
            if (isColliding(assassinRect, opponentRect)) {
                const damage = opponent.maxHp ? opponent.maxHp * 0.5 : 50;
                socket.emit("hitTaken", {
                    targetId: opponent.id,
                    roomId,
                    attackPower: damage
                });
            }
        });

        if (progress < 1) {
            requestAnimationFrame(dashStep);
        } else {
            this.isDashing = false;

            // Auto-disable after 5s or 2 dashes
            if (this.dashAvailable <= 0) {
                this.specialActive = false;
                clearTimeout(this.specialTimer);
            }
        }
    };

    requestAnimationFrame(dashStep);
}


 attack(ctx, type) {
    if (type === "special") {
        this.special(); // call special dash
        return;
    }

    if (this.isAttacking || this.isDashing) return;

    this.isAttacking = true;

    if (type === "basic") {
        this.attackBox.width = 25;
        this.attackBox.height = 14;

        const atkBox = {
            x: this.attackBox.position.x + this.attackBox.offsetX,
            y: this.attackBox.position.y + this.attackBox.offsetY,
            width: this.attackBox.width,
            height: this.attackBox.height
        };

        Object.values(otherPlayers).forEach(opponent => {
            const opponentRect = {
                id: opponent.id,
                x: opponent.x,
                y: opponent.y,
                width: opponent.width,
                height: opponent.height
            };

            if (isColliding(atkBox, opponentRect)) {
                this.hitsLanded++;
                socket.emit("hitTaken", {
                    targetId: opponent.id,
                    roomId,
                    attackPower: this.basic
                });
            }
        });

        setTimeout(() => {
            this.isAttacking = false;
        }, 500);
    }
}

} 


class  BackgroundSprite {
  constructor(imagePaths, frameDelay, canvasWidth, canvasHeight)
  {
    this.frames=  [];
    this.currentFrame = 0;
    this.frameDelay = frameDelay;
    this.lastFrameTime = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.ground  = canvas.height - 10;

    //load frames
    imagePaths.forEach((path)=>{
        const img = new Image();
        img.src = path;
        this.frames.push(img);
    })
  }
  draw (ctx,timestamp)
  {
    if(timestamp -this.lastFrameTime > this.frameDelay)
    {
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        this.lastFrameTime = timestamp;
    }
    const  frame = this.frames[this.currentFrame];
    ctx.drawImage(frame, 0, 0, this.canvasWidth, this.canvasHeight);
  }
}