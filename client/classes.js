class Character {
        constructor (x,y,color,width,height,id){
            this.x = x;
            this.y = y;
            this.width =width;
            this.height = height;
            this.color=  color;
            this.id = id;
            this.isAttacking = false;
            this.attackBox = {
                position:{x:this.x, y:this.y},
                width: 0,
                height: 0,
                offsetY:0,  
                offsetDirection: 1,  // 1 for right, -1 for left 
                 offsetX: 0
            };
            this.attackBox.offsetX = this.width * this.attackBox.offsetDirection;
        }
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width,this.height);
            // Draw attack box if attacking
            if  (this.isAttacking ){
                 this.attackBox.offsetX = this.width * this.attackBox.offsetDirection;
                console.log("Drawing attack box");
                 ctx.fillStyle = "grey";
        ctx.fillRect(this.attackBox.position.x+ this.attackBox.offsetX, this.attackBox.position.y+this.attackBox.offsetY, this.attackBox.width, this.attackBox.height);
            }
        }
        move(keys) {
            if (keys['d']) this.x += this.speed;
            if (keys["a"]) this.x -=  this.speed;
            if (keys["w"]) this.y -= this.speed;
            if (keys["s"]) this.y += this.speed;      
            // Update attack box position
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
        console.log(`${this.width} ${this.height}`);
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
