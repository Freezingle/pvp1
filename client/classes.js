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

    move(keys) {
        if (keys['d']) this.x += this.speed;
        if (keys['a']) this.x -= this.speed;
        if (keys['w']) this.y -= this.speed;
        if (keys['s']) this.y += this.speed;

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
        this.attackBox.height = 30; // Taller attack box
    }
    attack (ctx){
        if (this.isAttacking) return; // Prevent multiple attacks at once
        this.isAttacking = true;
       
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
    constructor(x, y, color,width,height, id) {
        super(x, y, color,width,height, id);
        this.speed = 10; // Assassins are faster
        this.type = "Assassin"; 
        this.attackBox.width = 25; // Narrower attack box
        this.attackBox.height = 14;
        this.attackBox.offsetY =20;
    }
    attack(ctx) {
        if (this.isAttacking) return; // Prevent multiple attacks at once
        this.isAttacking = true;
        
        console.log("Assassin strikes swiftly!");
        //activate attack box here
       
        setTimeout(() => {
      this.isAttacking = false;
      console.log("Attack ended");

      // Deactivate attack box here
    }, 500);
    }
} 