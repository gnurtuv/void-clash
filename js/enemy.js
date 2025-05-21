// js/enemy.js - Base Enemy Class
class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 30; 
        this.height = 30;
        this.x = Math.random() * (this.game.width - this.width);
        this.y = -this.height;
        this.markedForDeletion = false;
        this.scoreValue = 10;
        this.image = null; 
        this.animationTimer = Math.random() * 2000; 
        this.baseHealth = 1; 
        this.health = this.baseHealth + (game.waveNumber > 1 ? (game.waveNumber -1) * this.waveHealthBonusFactor() : 0);
        this.hitTimer = 0; 
        this.hitFlashDuration = 120; 
        this.hitScaleEffect = 1.05; 
    }

    waveHealthBonusFactor() { 
        return 1; 
    }

    update(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.hitTimer > 0) {
            this.hitTimer -= deltaTime;
            if (this.hitTimer < 0) this.hitTimer = 0;
        }
    }

    draw(ctx) { 
        let scaleFactor = 1.0;
        if (this.hitTimer > 0) {
            const progress = (this.hitFlashDuration - this.hitTimer) / this.hitFlashDuration;
            scaleFactor = 1 + (this.hitScaleEffect - 1) * Math.sin(progress * Math.PI); 
        }

        ctx.save();
        if (scaleFactor !== 1.0) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(scaleFactor, scaleFactor);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }


        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            if (this.hitTimer > 0) {
               ctx.globalCompositeOperation = 'source-atop';
               const flashAlpha = 0.6 * (this.hitTimer / this.hitFlashDuration);
               ctx.fillStyle = `rgba(255,150,150,${flashAlpha})`; 
               ctx.fillRect(this.x, this.y, this.width, this.height);
               ctx.globalCompositeOperation = 'source-over'; // Reset composite op
            }
        } else {
            ctx.fillStyle = this.hitTimer > 0 ? `rgba(255,100,100,${0.5 + 0.3 * (this.hitTimer/this.hitFlashDuration)})` : (this.color || '#FF0000'); 
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitTimer = this.hitFlashDuration; 
        if (this.health <= 0) {
            this.markedForDeletion = true;
            return true; 
        }
        return false; 
    }
}