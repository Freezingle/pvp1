class Character {
    constructor(x, y, color, width, height, id) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.id = id;
        this.isAttacking = false;
        this.facingDirection = 1;
        this.hitPoints = 100;
        this.maxHp = 100;
        this.gravity = 0.7;
        this.velocityY = 0;
        this.ground = canvas.height - 10 - this.height;
        this.specialActive = false;
        this.specialTimer = null;
        this.maxStamina = 100;
        this.stamina = this.maxStamina;
        this.staminaRegenRate = 1;
        this.staminaDrainRate = 5;
        this.isDefending = false;
        this.defenceMultiplier = 0.4;
        this.hitsLanded = 0;

        this.attackBox = {
            position: { x: this.x, y: this.y },
            width: 0,
            height: 0,
            offsetY: 0,
            offsetX: this.width
        };
    }

    updateAttackDirection(opponentX) {
        this.facingDirection = opponentX < this.x ? -1 : 1;
        this.attackBox.offsetX = this.facingDirection === 1 ? this.width : -this.attackBox.width;
    }

    updateStamina() {
        if (this.isDefending) {
            this.stamina = Math.max(0, this.stamina - this.staminaDrainRate);
            if (this.stamina === 0) {
                this.stopDefend?.();
            }
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if (this.isAttacking && this.attackBox.width > 0 && this.attackBox.height > 0 && !this.specialActive) {
            this.attackBox.position.x = this.x;
            this.attackBox.position.y = this.y;
            ctx.fillStyle = "grey";
            ctx.fillRect(
                this.attackBox.position.x + this.attackBox.offsetX,
                this.attackBox.position.y + this.attackBox.offsetY,
                this.attackBox.width,
                this.attackBox.height
            );
        } else if (this.detonating && this.detonation) {
            ctx.fillStyle = "orange";
            ctx.fillRect(
                this.detonation.x,
                this.detonation.y,
                this.detonation.width,
                this.detonation.height
            );
        }
    }

    gotHit(damage, attackerId) {
        this.hitPoints -= damage;
        console.log(`Character ${this.id} got hit by ${attackerId}. Remaining HP: ${this.hitPoints}`);
        if (this.hitPoints <= 0) {
            console.log(`Character ${this.id} has been defeated!`);
            socket.emit("playerDefeated", { roomId, defeatedId: this.id, winnerId: attackerId });
        }
    }

    move(keys) {
        const speedModifier = this.isDefending ? 0.4 : 1;

        if (keys['d']) this.x += this.speed * speedModifier;
        if (keys['a']) this.x -= this.speed * speedModifier;
        if (keys['s'] && this.y + this.speed <= this.ground) this.y += this.speed * speedModifier;

        if (keys['w'] && this.y >= this.ground) {
            this.velocityY = -15;
        }

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
    constructor(x, y, color, width, height, id) {
        super(x, y, color, width, height, id);
        this.speed = 4;
        this.type = "Bruiser";
        this.attackBox.width = 50;
        this.attackBox.height = this.height;
        this.punchPower = 20;
        this.hitPoints = 350;
        this.maxHp = 350;
        this.detonation = null;
        this.detonating = false;
    }

    activateSpecial() {
        this.speed = 8;
        this.specialActive = true;
        this.specialTimer = setTimeout(() => {
            this.detonating = false;
            this.isAttacking = false;
            this.specialActive = false;
            this.speed = 4;
            this.detonation = null;
        }, 1000);
    }

    special() {
        if (!this.specialActive || !this.isAttacking) return;

        this.detonating = true;
        this.isAttacking = true;

        const width = this.width * 3;
        const height = this.height * 2;

        this.detonation = {
            x: this.x + this.width / 2 - width / 2,
            y: this.y + this.height / 2 - height / 2,
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

            if (isColliding(this.detonation, opponentRect)) {
                socket.emit("hitTaken", { targetId: opponent.id, roomId, attackPower: 80 });
            }
        });

        clearTimeout(this.specialTimer);
        this.specialTimer = setTimeout(() => {
            this.detonating = false;
            this.isAttacking = false;
            this.specialActive = false;
            this.speed = 4;
            this.detonation = null;
        }, 300);
    }

    attack(ctx, type) {
        if (this.isAttacking) return;
        this.isAttacking = true;

        if (type === "special") {
            this.activateSpecial();
            return;
        } else if (type !== "basic") return;

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
                socket.emit("hitTaken", { targetId: opponent.id, roomId, attackPower: this.punchPower });
            }
        });

        setTimeout(() => {
            this.isAttacking = false;
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
        this.maxHp = 160;
        this.dashAvailable = 0;
        this.isDashing = false;
    }

    activateSpecial() {
        console.log("inside activate special 1st line")
        if (this.specialActive) return;
        console.log("specialActive is true now")

        this.specialActive = true;
        this.dashAvailable = 2;  // Ready for 2 dashes

        // Disable special after 5 seconds (like Bruiser)
        this.specialTimer = setTimeout(() => {
            this.specialActive = false;
            console.log("special attack ended")
            this.dashAvailable = 0;
        }, 5000);
    }

 special() {
    console.log("inside assassin special fn");
    if (!this.specialActive || this.dashAvailable <= 0 || this.isDashing) return;
    console.log("crossed the if statement, now dashing");

    this.isDashing = true;
    this.dashAvailable--;

    const startX = this.x;
    const endX = this.facingDirection === 1
        ? canvas.width - this.width  // Dash to right edge
        : 0;                         // Dash to left edge

    const distance = endX - startX;
    const duration = 300;  // Optional: Increase duration slightly for long dash
    const startTime = performance.now();

    const dashStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this.x = startX + distance * progress;

        Object.values(otherPlayers).forEach(opponent => {
            const opponentRect = {
                id: opponent.id,
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
            if (this.dashAvailable <= 0) {
                this.specialActive = false;
                clearTimeout(this.specialTimer);
            }
        }
    };

    requestAnimationFrame(dashStep);
}


    attack(ctx, type) {
        console.log("inside attack of assasin")
        if (type === "special") {
            console.log("type === special")
            this.activateSpecial(); //activating special
            return;
        }

        if (this.isAttacking || this.isDashing) return;

        this.isAttacking = true;

        if (type === "basic") {
                        console.log("type === basic")

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

 
class BackgroundSprite {
    constructor(imagePaths, frameDelay, canvasWidth, canvasHeight) {
        this.frames = [];
        this.currentFrame = 0;
        this.frameDelay = frameDelay;
        this.lastFrameTime = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        imagePaths.forEach((path) => {
            const img = new Image();
            img.src = path;
            this.frames.push(img);
        });
    }

    draw(ctx, timestamp) {
        if (timestamp - this.lastFrameTime > this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.lastFrameTime = timestamp;
        }

        const frame = this.frames[this.currentFrame];
        if (frame.complete) {
            ctx.drawImage(frame, 0, 0, this.canvasWidth, this.canvasHeight);
        }
    }
}
