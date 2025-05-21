// js/particle.js
class Particle {
    constructor(x, y, color, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 1.5; // Particle size
        
        this.baseSpeed = 2.5;
        const angle = Math.random() * Math.PI * 2;
        this.speedX = Math.cos(angle) * (Math.random() * this.baseSpeed + 0.5);
        this.speedY = Math.sin(angle) * (Math.random() * this.baseSpeed + 0.5);
        
        this.color = color;
        this.lifeSpan = Math.random() * 400 + 200; // Milliseconds
        this.currentLifeTime = 0;
        this.initialAlpha = 0.8;
        this.alpha = this.initialAlpha;
    }

    update(deltaTime) {
        const dtFactor = deltaTime / (1000 / 60); // Normalization factor
        
        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor;
        
        this.speedX *= 0.98; // Friction
        this.speedY *= 0.98; // Friction

        this.currentLifeTime += deltaTime;
        this.alpha = this.initialAlpha * (1 - (this.currentLifeTime / this.lifeSpan)); // Fade out
        this.size *= 0.99; // Shrink
        if (this.size < 0.5) this.size = 0.5;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isAlive() {
        return this.currentLifeTime < this.lifeSpan && this.alpha > 0 && this.size > 0.5;
    }
}