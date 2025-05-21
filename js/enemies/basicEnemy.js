// js/enemies/basicEnemy.js
class BasicEnemy extends Enemy {
    constructor(game) {
        super(game);
        this.image = document.getElementById('enemyAlienSprite');
        this.width = 45; 
        this.height = 50; 
        this.x = Math.random() * (this.game.width - this.width);
        this.baseHealth = 2; 
        this.health = this.baseHealth + (this.game.waveNumber > 1 ? (this.game.waveNumber -1) * this.waveHealthBonusFactor() : 0);


        this.speedY = 1.8 + Math.random() * 2.5; 
        this.color = '#7FFF00'; 
        this.scoreValue = 15; 

        this.bobAmplitude = 3;
        this.bobFrequency = 0.0025;
        this.horizontalScaleMin = 0.95;
        this.horizontalScaleMax = 1.05;
        this.horizontalScaleFrequency = 0.0018; 
        this.maxWobbleAngle = 0.08; 
        this.wobbleFrequency = 0.0022; 
    }
    waveHealthBonusFactor() { return 1; } 

    update(deltaTime) {
        super.update(deltaTime); 
        const dtFactor = deltaTime / (1000 / 60);
        this.y += this.speedY * dtFactor;
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
            this.game.handleEnemyReachedBottom(this);
        }
    }

    draw(ctx) { 
        const verticalBobOffset = Math.sin(this.animationTimer * this.bobFrequency) * this.bobAmplitude;
        const scaleRange = this.horizontalScaleMax - this.horizontalScaleMin;
        const currentHorizontalScale = this.horizontalScaleMin + (Math.sin(this.animationTimer * this.horizontalScaleFrequency) + 1) / 2 * scaleRange;
        const currentWobbleAngle = Math.sin(this.animationTimer * this.wobbleFrequency) * this.maxWobbleAngle;

        let hitScaleFactor = 1.0;
        if (this.hitTimer > 0) {
            const progress = (this.hitFlashDuration - this.hitTimer) / this.hitFlashDuration;
            hitScaleFactor = 1 + (this.hitScaleEffect - 1) * Math.sin(progress * Math.PI);
        }

        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + verticalBobOffset;
        ctx.translate(centerX, centerY);
        ctx.rotate(currentWobbleAngle);
        ctx.scale(currentHorizontalScale * hitScaleFactor, 1 * hitScaleFactor); 

        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
             ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
             if (this.hitTimer > 0) { 
                ctx.globalCompositeOperation = 'source-atop';
                const flashAlpha = 0.5 * (this.hitTimer / this.hitFlashDuration);
                ctx.fillStyle = `rgba(255,180,180,${flashAlpha})`;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                ctx.globalCompositeOperation = 'source-over'; 
             }
        } else {
            ctx.fillStyle = this.hitTimer > 0 ? `rgba(255,150,150,${0.6 + 0.2 * (this.hitTimer/this.hitFlashDuration)})` : '#CC0000'; 
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
}