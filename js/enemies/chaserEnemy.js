// js/enemies/chaserEnemy.js
class ChaserEnemy extends Enemy {
    constructor(game) {
        super(game);
        this.image = document.getElementById('enemyChaserSprite');
        this.width = 40; 
        this.height = 65; 
        this.x = Math.random() * (this.game.width - this.width); 
        this.baseHealth = 3; 
        this.health = this.baseHealth + (this.game.waveNumber > 1 ? (this.game.waveNumber -1) * this.waveHealthBonusFactor() : 0);


        this.speedY = 1.2 + Math.random() * 0.8; 
        this.speedX = 0;
        this.chaseSpeed = 3.0; 
        this.color = '#FF4500'; 
        this.scoreValue = 30; 

        this.glowMinAlpha = 0.2;
        this.glowMaxAlpha = 0.7;
        this.glowFrequency = 0.003;
        this.glowColor = 'rgba(255, 100, 0, 0.5)'; 
    }
    waveHealthBonusFactor() { return 1; }

    update(deltaTime) {
        super.update(deltaTime); 
        const dtFactor = deltaTime / (1000 / 60);
        this.y += this.speedY * dtFactor;
        if (this.game.player && !this.game.player.isDying) { 
            const playerCenterX = this.game.player.x + this.game.player.width / 2;
            const targetX = playerCenterX - this.width / 2; 
            const dx = targetX - this.x;
            this.x += Math.max(-this.chaseSpeed, Math.min(this.chaseSpeed, dx * 0.1)) * dtFactor;
        }
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) {
            this.x = this.game.width - this.width;
        }
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
            this.game.handleEnemyReachedBottom(this);
        }
    }
    draw(ctx) { 
        ctx.save();
        let scaleFactor = 1.0;
        if (this.hitTimer > 0) {
            const progress = (this.hitFlashDuration - this.hitTimer) / this.hitFlashDuration;
            scaleFactor = 1 + (this.hitScaleEffect - 1) * Math.sin(progress * Math.PI);
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(scaleFactor, scaleFactor);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }
        
        const alphaRange = this.glowMaxAlpha - this.glowMinAlpha;
        let currentGlowEffectiveAlpha = this.glowMinAlpha + (Math.sin(this.animationTimer * this.glowFrequency) + 1) / 2 * alphaRange;
        if (this.hitTimer > 0) currentGlowEffectiveAlpha *= (0.3 + 0.7 * (1 - this.hitTimer / this.hitFlashDuration)); // Dim glow more as flash ends

        ctx.globalAlpha = currentGlowEffectiveAlpha; 
        ctx.fillStyle = this.glowColor.replace(/[\d\.]+\)$/g, `${ctx.globalAlpha.toFixed(2)})`);
        const auraWidth = this.width * 1.3;
        const auraHeight = this.height * 1.2;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, 
                    this.y + this.height / 2, 
                    auraWidth / 2, 
                    auraHeight / 2, 
                    0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; 

        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
             ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
             if (this.hitTimer > 0) { 
                ctx.globalCompositeOperation = 'source-atop';
                const flashAlpha = 0.4 * (this.hitTimer / this.hitFlashDuration);
                ctx.fillStyle = `rgba(255,150,150,${flashAlpha})`;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.globalCompositeOperation = 'source-over';
             }
        } else { 
             ctx.fillStyle = this.hitTimer > 0 ? `rgba(255,120,120,${0.6 + 0.2 * (this.hitTimer/this.hitFlashDuration)})` : this.color;
             ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}