// js/enemies/shootingEnemy.js
class ShootingEnemy extends Enemy {
    constructor(game) {
        super(game);
        this.image = document.getElementById('enemyRocketImpSprite'); 
        this.width = 50; 
        this.height = 70; 
        this.x = Math.random() * (this.game.width - this.width);
        this.baseHealth = 5; 
        this.health = this.baseHealth + (this.game.waveNumber > 1 ? (this.game.waveNumber -1) * this.waveHealthBonusFactor() : 0);


        this.color = '#B22222'; 
        this.scoreValue = 50; 

        this.state = 'descending_initial'; 
        this.hoverY = 40 + Math.random() * 60; 
        this.hoverSpeedX = 1.2 + Math.random() * 0.8;
        this.hoverDirection = Math.random() < 0.5 ? 1 : -1;
        this.hoverTimer = 0;
        this.hoverDuration = 6000 + Math.random() * 3000; 

        this.initialDescendSpeed = 1.3;
        this.finalDescendSpeed = 0.8;

        this.shootCooldown = 1000 + Math.random() * 700; 
        this.lastShotTime = performance.now() + Math.random() * this.shootCooldown; 

        this.exhaustGlowMin = 0.4;
        this.exhaustGlowMax = 1.0;
        this.exhaustGlowFrequency = 0.008; 
        this.eyeGlowMin = 0.5;
        this.eyeGlowMax = 0.9;
        this.eyeGlowFrequency = 0.003;
        this.wingFlapAmplitude = 2; 
        this.wingFlapFrequency = 0.005;
    }
    waveHealthBonusFactor() { return 2; } 

    update(deltaTime) { 
        super.update(deltaTime);
        const dtFactor = deltaTime / (1000 / 60);
        if (this.state === 'descending_initial') {
            this.y += this.initialDescendSpeed * dtFactor;
            if (this.y >= this.hoverY) {
                this.y = this.hoverY;
                this.state = 'hovering';
                this.hoverTimer = 0;
                this.lastShotTime = performance.now(); 
            }
        } else if (this.state === 'hovering') {
            this.x += this.hoverSpeedX * this.hoverDirection * dtFactor;
            this.hoverTimer += deltaTime;
            if (this.x <= 0 || this.x + this.width >= this.game.width) {
                this.hoverDirection *= -1;
                this.x = Math.max(0, Math.min(this.x, this.game.width - this.width)); 
            }
            if (this.hoverTimer > this.hoverDuration) {
                this.state = 'descending_final';
            }
            const currentTime = performance.now();
            if (currentTime - this.lastShotTime > this.shootCooldown) {
                this.shoot();
                this.lastShotTime = currentTime;
            }
        } else if (this.state === 'descending_final') {
            this.y += this.finalDescendSpeed * dtFactor;
        }
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }
    shoot() {
        const bulletX = this.x + this.width / 2;
        const bulletY = this.y + this.height * 0.35; 
        this.game.addEnemyBullet(new EnemyBullet(bulletX, bulletY, this.game));
    }
    draw(ctx) { 
        const wingFlapOffset = Math.sin(this.animationTimer * this.wingFlapFrequency) * this.wingFlapAmplitude;
        ctx.save();
        let scaleFactor = 1.0;
        if (this.hitTimer > 0) {
            const progress = (this.hitFlashDuration - this.hitTimer) / this.hitFlashDuration;
            scaleFactor = 1 + (this.hitScaleEffect - 1) * Math.sin(progress * Math.PI);
            // Apply scale transformation centered on the current visual position
            const currentVisualY = this.y + wingFlapOffset;
            ctx.translate(this.x + this.width / 2, currentVisualY + this.height / 2);
            ctx.scale(scaleFactor, scaleFactor);
            ctx.translate(-(this.x + this.width / 2), -(currentVisualY + this.height / 2));
        }

        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
             ctx.drawImage(this.image, this.x, this.y + wingFlapOffset, this.width, this.height);
             if (this.hitTimer > 0) { 
                ctx.globalCompositeOperation = 'source-atop';
                const flashAlpha = 0.4 * (this.hitTimer / this.hitFlashDuration);
                ctx.fillStyle = `rgba(255,150,150,${flashAlpha})`;
                ctx.fillRect(this.x, this.y + wingFlapOffset, this.width, this.height); // Ensure flash covers scaled area if not transformed
             }
        } else {
            ctx.fillStyle = this.hitTimer > 0 ? `rgba(255,120,120,${0.6 + 0.2 * (this.hitTimer/this.hitFlashDuration)})` : this.color; 
            ctx.fillRect(this.x, this.y + wingFlapOffset, this.width, this.height);
        }
        
        ctx.globalCompositeOperation = 'source-over'; 

        let currentExhaustAlpha = this.exhaustGlowMin + (Math.sin(this.animationTimer * this.exhaustGlowFrequency) + 1) / 2 * (this.exhaustGlowMax - this.exhaustGlowMin);
        if(this.hitTimer > 0) currentExhaustAlpha *= (0.4 + 0.6 * (1 - this.hitTimer / this.hitFlashDuration)); 
        
        const exhaustCenterX = this.x + this.width / 2;
        const exhaustCenterY = this.y + wingFlapOffset + this.height * 0.85; 
        const exhaustRadiusX = this.width * 0.15;
        const exhaustRadiusY = this.height * 0.2;
        ctx.fillStyle = `rgba(255, 69, 0, ${currentExhaustAlpha})`; 
        ctx.beginPath();
        ctx.ellipse(exhaustCenterX, exhaustCenterY, exhaustRadiusX, exhaustRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        let currentEyeAlpha = this.eyeGlowMin + (Math.sin(this.animationTimer * this.eyeGlowFrequency + Math.PI/2) + 1) / 2 * (this.eyeGlowMax - this.eyeGlowMin); 
        if(this.hitTimer > 0) currentEyeAlpha *= (0.4 + 0.6 * (1 - this.hitTimer / this.hitFlashDuration));

        const eyeGlowCenterX = this.x + this.width/2;
        const eyeGlowCenterY = this.y + wingFlapOffset + this.height * 0.25; 
        const eyeGlowRadius = this.width * 0.2;
        ctx.fillStyle = `rgba(255, 0, 0, ${currentEyeAlpha})`; 
        ctx.beginPath();
        ctx.ellipse(eyeGlowCenterX, eyeGlowCenterY, eyeGlowRadius, eyeGlowRadius * 0.7, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}