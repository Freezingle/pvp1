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
        this.hitPoints= 100; // Default hit points
        this.gravity = 0.7;
        this.velocityY = 0; // Vertical velocity for gravity effect
        this.ground = canvas.height -10- this.height; // TODO make this dynamic
        this.specialActive = false;
                this.specialTimer = null;


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

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if (this.isAttacking) {
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
        if (keys['d']) this.x += this.speed;
        if (keys['a']) this.x -= this.speed;
        if (keys['s']) this.y += this.speed;

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
        this.maxHp = 200;
    }
    
    activateSpecial(){
        if(this.specialActive) return; 
        //setting up boosts for special atk
        this.specialActive = true;
        //storing the original atributes
        this._originalSpeed = this.speed;
    this._originalAttackBox = {
        width: this.attackBox.width,
        height: this.attackBox.height,
        offsetX: this.attackBox.offsetX,
        offsetY: this.attackBox.offsetY
    };
        this.speed= 8;  //temporary speed boost

    this.attackBox.width = this.width * 2; // Wider area
    this.attackBox.height = this.height * 1.5; // Taller area
    this.attackBox.offsetX = -this.width / 2; // Centered
    this.attackBox.offsetY = -this.height * 0.25;

    setTimeout(() => {
        this.specialActive = false;
        this.speed = this._originalSpeed;
        this.attackBox.width = this._originalAttackBox.width;
        this.attackBox.height = this._originalAttackBox.height;
        this.attackBox.offsetX = this._originalAttackBox.offsetX;
        this.attackBox.offsetY = this._originalAttackBox.offsetY;
    }, 5000);
}
    special(ctx) {

    if (!this.specialActive || this.isAttacking) return;

    this.isAttacking = true;

    // Little jump effect
    this.velocityY = -8; // Adjust as needed

    // Use the special attack box (already set by activateSpecial)
    const atkBox = {
        x: this.attackBox.position.x ,
        y: this.attackBox.position.y,
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
            // Deal extra damage for special attack
            socket.emit("hitTaken", {
                targetId: opponent.id,
                roomId,
                attackPower: this.punchPower * 2 // or any special value
            });
        }
    });

    // Attack animation duration (shorter than special duration)
    setTimeout(() => {
        this.isAttacking = false;
    }, 600); // Adjust as needed
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
      x: player.attackBox.position.x + player.attackBox.offsetX,
      y: player.attackBox.position.y + player.attackBox.offsetY,
      width: player.attackBox.width,
      height: player.attackBox.height
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
        socket.emit("hitTaken", { targetId: opponent.id, roomId,  attackPower:  player.punchPower });
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
        this.dashPower;
        this.atkBox;
        // Dash special state
        this.dashAvailable = 0;
        this.maxHp = 90;
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
    const endX = this.facingDirection  ===1
        ? canvas.width - this.width
        : 0;
    const distance = endX - startX;
    const duration = 200;
    const startTime = performance.now();

    const dashStep = (now) => {
        const elapsed = now - startTime;
        let progress = Math.min(elapsed / duration, 1);
        this.x = startX + distance * progress;

        // Check collision with all opponents on each frame
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
                // 50% of opponent's max health
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
            if (this.dashAvailable === 0) {
                this.specialActive = false;
                clearTimeout(this.specialTimer);
            }
        }
    };

    requestAnimationFrame(dashStep);
}

    attack(ctx, type) {
        if (type === "special") {
            this.activateSpecial();
            return;
        }
        if (this.isAttacking) return; // Prevent multiple attacks at once
        this.isAttacking = true;

        if(type== "basic")
        {
           this.attackBox.width = 25; // Narrower attack box
           this.attackBox.height = 14;

        //activate attack box here
       this.atkBox = {
      x: player.attackBox.position.x + player.attackBox.offsetX,
      y: player.attackBox.position.y + player.attackBox.offsetY,
      width: player.attackBox.width,
      height: player.attackBox.height
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
        socket.emit("hitTaken", { targetId: opponent.id, roomId,  attackPower:  player.basic });
      }
    });
      setTimeout(() => {
      this.isAttacking = false;
      console.log("Attack ended");
      return;

      // Deactivate attack box here

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