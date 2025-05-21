// js/bullet.js
class PlayerBullet {
    constructor(x, y, game) {
        this.game = game;
        this.width = 5;
        this.height = 15;
        this.x = x - this.width / 2;
        this.y = y - this.height; // Initial Y before potential rotation
        this.speed = 10;
        this.color = '#00FF00'; 
        this.angle = 0; // Default angle (straight up relative to game, which is -PI/2 in math terms)
                        // For player, 0 means straight up, positive angle is right, negative is left.
        this.speedX = 0;
        this.speedY = -this.speed; // Default straight up
    }

    update(deltaTime) {
        // If an angle was set (for spread shot), calculate speedX and speedY once
        if (this.angle !== 0 && this.speedY === -this.speed) { // Check if not already calculated
            // Convert player's visual angle to standard math angle for trig
            // Player's 0 angle = -Math.PI / 2 (straight up)
            const mathAngle = -Math.PI / 2 + this.angle;
            this.speedX = Math.cos(mathAngle) * this.speed;
            this.speedY = Math.sin(mathAngle) * this.speed;
        }
        
        const dtFactor = deltaTime / (1000/60);
        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor; 
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2); // Translate to center of bullet
        if (this.angle !== 0) {
            ctx.rotate(this.angle); // Rotate by its angle
        }
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height); // Draw centered
        ctx.restore();
    }
}

class EnemyBullet {
    constructor(x, y, game, speedX = 0, speedY = 4) { 
        this.game = game;
        this.size = 8; 
        this.x = x;
        this.y = y;
        this.baseSpeedY = speedY; 
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = '#FF0000'; 
        this.glowColor = 'rgba(255, 100, 100, 0.5)';
    }

    update(deltaTime) {
        const dtFactor = deltaTime / (1000/60);
        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor;
    }

    setDirection(angle, speedMagnitude) {
        this.speedX = Math.cos(angle) * speedMagnitude;
        this.speedY = Math.sin(angle) * speedMagnitude;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getBoundingBox() {
        return {
            x: this.x - this.size * 0.5 * 0.5, 
            y: this.y - this.size * 0.5 * 0.5,
            width: this.size * 0.5,
            height: this.size * 0.5
        };
    }
}