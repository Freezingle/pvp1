class Character {
        constructor (x,y,color,id){
            this.x = x;
            this.y = y;
            this.color=  color;
            this.id = id;
        }
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 50, 50);
        }
        move(keys) {
            if (keys['d']) this.x += this.speed;
            if (keys["a"]) this.x -=  this.speed;
            if (keys["w"]) this.y -= this.speed;
            if (keys["s"]) this.y += this.speed;      
            
        }   
}

class Bruiser extends Character {
    constructor(x, y, color, id) {
        super(x, y, color, id);
        this.speed = 4; // Bruisers are slower
        this.type = "Bruiser";
    }
}

class Assassin extends Character {
    constructor(x, y, color, id) {
        super(x, y, color, id);
        this.speed = 10; // Assassins are faster
        this.type = "Assassin"; 
    }
}