// js/enemies/kamikazeEnemy.js
class KamikazeEnemy extends Enemy {
    constructor(game) {
        super(game);
        this.game = game;
        this.image = document.getElementById('enemyKamikazeSprite');
        this.width = 35; // Adjusted for new sprite (it's somewhat elongated)
        this.height = 50; // Adjusted
        this.x = Math.random() < 0.5 ? -this.width - 20 : this.game.width + 20; 
        this.y = Math.random() * (this.game.height * 0.7); // Spawn in upper 70%

        this.baseHealth = 1; 
        this.health = this.baseHealth; 

        this.speed = 3.8 + Math.random() * 1.8; // Slightly faster
        this.color = '#FF8C00'; // DarkOrange for particles
        this.trailColor = 'rgba(255, 69, 0, 0.4)'; // Brighter trail
        this.scoreValue = 25;
        this.damageToPlayer = 1; 

        // Targeting logic remains the same, recalculated on spawn based on player pos
        if (this.game.player) { // Ensure player exists when calculating target
            this.targetX = this.game.player.x + this.game.player.width / 2;
            this.targetY = this.game.player.y + this.game.player.height / 2;
            const angle = Math.atan2(this.targetY - (this.y + this.height/2), this.targetX - (this.x + this.width/2));
            this.speedX = Math.cos(angle) * this.speed;
            this.speedY = Math.sin(angle) * this.speed;
        } else { // Fallback if player doesn't exist (e.g., during initial setup if order is off)
            this.speedX = 0;
            this.speedY = this.speed; // Default to moving downwards
        }
        

        this.trailTimer = 0;
        this.trailInterval = 40; 

        this.rotation = 0; // For visual rotation towards target
        this.rotation = Math.atan2(this.speedY, this.speedX) + Math.PI / 2; // Align with movement vector, +PI/2 because sprite faces up

        this.eyeGlowMin = 0.4;
        this.eyeGlowMax = 0.9;
        this.eyeGlowFrequency = 0.006;
    }

    waveHealthBonusFactor() { return 0; } 

    update(deltaTime) {
        super.update(deltaTime);
        const dtFactor = deltaTime / (1000 / 60);

        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor;

        this.trailTimer += deltaTime;
        if (this.trailTimer >= this.trailInterval) {
            this.trailTimer = 0;
            const particle = new Particle(this.x + this.width / 2, this.y + this.height / 2, this.trailColor, this.game);
            particle.size = Math.random() * 3.5 + 2.5; // Slightly larger trail particles
            particle.speedX = -this.speedX * 0.15 * (Math.random() * 0.5 + 0.2); 
            particle.speedY = -this.speedY * 0.15 * (Math.random() * 0.5 + 0.2);
            particle.lifeSpan = 180 + Math.random()*120;
            this.game.particles.push(particle);
        }

        if (this.x < -this.width * 2 || this.x > this.game.width + this.width ||
            this.y < -this.height * 2 || this.y > this.game.height + this.height) {
            this.markedForDeletion = true;
        }
    }

    explode() {
        if (this.markedForDeletion) return; // Prevent multiple explosions
        this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, this.color, 35, 1.8); 
        this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#FFA500', 25, 1.2); 
        this.game.triggerScreenShake(8, 18);
        this.markedForDeletion = true;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.markedForDeletion) {
            this.explode(); 
            return true; 
        }
        return false; 
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation); // Rotate to face movement direction

        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            
            // Pulsing Eye Glow (overlay on the sprite's eye area)
            const eyeGlowAlphaRange = this.eyeGlowMax - this.eyeGlowMin;
            const currentEyeGlowAlpha = this.eyeGlowMin + (Math.sin(this.animationTimer * this.eyeGlowFrequency) + 1) / 2 * eyeGlowAlphaRange;
            
            // Approximate position of the eye relative to the sprite's center (0,0 after translate)
            const eyeOffsetX = 0; 
            const eyeOffsetY = this.height * 0.25; // Lower part of the sprite where the eye is
            const eyeRadius = this.width * 0.15;

            ctx.fillStyle = `rgba(255, 165, 0, ${currentEyeGlowAlpha})`; // Orange-Yellow glow
            ctx.beginPath();
            ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

        } else { // Fallback drawing
            ctx.fillStyle = this.color;
            ctx.beginPath();
            const spikes = 8;
            const outerRadius = this.width / 2;
            const innerRadius = this.width / 3;
            ctx.moveTo(0, -outerRadius);
            for (let i = 0; i < spikes; i++) {
                ctx.rotate(Math.PI / spikes);
                ctx.lineTo(0, -innerRadius);
                ctx.rotate(Math.PI / spikes);
                ctx.lineTo(0, -outerRadius);
            }
            ctx.fill();
            
            const corePulse = Math.sin(this.animationTimer * 0.01) * (outerRadius * 0.1) + (outerRadius * 0.2);
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)'; 
            ctx.beginPath();
            ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}