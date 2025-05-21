// js/missile.js
class PlayerHomingMissile {
    constructor(x, y, game) {
        this.game = game;
        this.image = document.getElementById('playerMissileSprite');
        // Adjust dimensions to suit the new missile sprite
        this.width = 18; 
        this.height = 30; 
        this.x = x - this.width / 2;
        this.y = y - this.height; // Start from just above the player
        
        this.speed = 2.8; // Slightly faster than before
        this.turnSpeed = 0.055; 
        this.currentAngle = -Math.PI / 2; 

        this.speedX = 0;
        this.speedY = -this.speed;

        this.target = null;
        this.searchForTargetTimer = 0;
        this.searchForTargetInterval = 180; 

        this.lifeSpan = 7000; 
        this.age = 0;
        this.markedForDeletion = false;

        this.trailTimer = 0;
        this.trailInterval = 50; 
        this.trailColor = 'rgba(255, 200, 0, 0.6)'; // Orange-yellow trail to match exhaust
        this.damage = 4; // Increased damage slightly

        this.animationTimer = Math.random() * 1000; // For internal sprite animations
        this.coreGlowMinAlpha = 0.4;
        this.coreGlowMaxAlpha = 0.9;
        this.coreGlowFrequency = 0.008;
    }

    findTarget() {
        let closestEnemy = null;
        let minDistance = Infinity;
        const selfCenterX = this.x + this.width / 2;
        const selfCenterY = this.y + this.height / 2;

        const potentialTargets = [...this.game.enemies];
        if (this.game.boss && this.game.boss.state === 'fighting') {
            potentialTargets.push(this.game.boss);
        }

        potentialTargets.forEach(enemy => {
            if (enemy.markedForDeletion || enemy.state === 'entering' || enemy.state === 'dying') return;

            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            const dx = enemyCenterX - selfCenterX;
            const dy = enemyCenterY - selfCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Simple cone check: only target enemies somewhat in front
            const angleToEnemy = Math.atan2(dy, dx);
            let angleDiff = angleToEnemy - this.currentAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            if (distance < minDistance && Math.abs(angleDiff) < Math.PI / 1.5) { // Target within a 120-degree cone
                minDistance = distance;
                closestEnemy = enemy;
            }
        });
        this.target = closestEnemy;
    }

    update(deltaTime) {
        this.age += deltaTime;
        this.animationTimer += deltaTime;
        if (this.age > this.lifeSpan) {
            this.markedForDeletion = true;
            this.game.createExplosion(this.x + this.width/2, this.y + this.height/2, this.trailColor, 10, 0.8); 
            return;
        }

        this.searchForTargetTimer += deltaTime;
        if (this.searchForTargetTimer >= this.searchForTargetInterval) {
            this.findTarget();
            this.searchForTargetTimer = 0;
        }
        
        if (this.target && !this.target.markedForDeletion) {
            const targetCenterX = this.target.x + this.target.width / 2;
            const targetCenterY = this.target.y + this.target.height / 2;
            const desiredAngle = Math.atan2(targetCenterY - (this.y + this.height / 2), targetCenterX - (this.x + this.width / 2));
            let angleDiff = desiredAngle - this.currentAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            if (Math.abs(angleDiff) < this.turnSpeed) this.currentAngle = desiredAngle;
            else this.currentAngle += Math.sign(angleDiff) * this.turnSpeed;
        }
        
        this.currentAngle = (this.currentAngle + 2 * Math.PI) % (2 * Math.PI);
        this.speedX = Math.cos(this.currentAngle) * this.speed;
        this.speedY = Math.sin(this.currentAngle) * this.speed;

        const dtFactor = deltaTime / (1000/60);
        this.x += this.speedX * dtFactor;
        this.y += this.speedY * dtFactor;

        this.trailTimer += deltaTime;
        if (this.trailTimer >= this.trailInterval) {
            this.trailTimer = 0;
            // Emit particle from back-center of missile
            const backOffsetX = Math.cos(this.currentAngle + Math.PI) * (this.height / 2); // Offset opposite to missile direction
            const backOffsetY = Math.sin(this.currentAngle + Math.PI) * (this.height / 2);
            const particleX = (this.x + this.width / 2) + backOffsetX;
            const particleY = (this.y + this.height / 2) + backOffsetY;

            const particle = new Particle(particleX, particleY, this.trailColor, this.game);
            particle.size = Math.random() * 2.5 + 1.5;
            particle.speedX = -this.speedX * 0.1; 
            particle.speedY = -this.speedY * 0.1;
            particle.lifeSpan = 200 + Math.random()*150;
            this.game.particles.push(particle);
        }

        if (this.y + this.height < -20 || this.y > this.game.height + 20 || 
            this.x + this.width < -20 || this.x > this.game.width + 20) { // Wider off-screen margin
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.currentAngle + Math.PI / 2); 
        
        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);

            // Optional: Add a pulsing glow to the sprite's core if it's not animated in the sprite itself
            const coreGlowAlphaRange = this.coreGlowMaxAlpha - this.coreGlowMinAlpha;
            const currentCoreGlowAlpha = this.coreGlowMinAlpha + (Math.sin(this.animationTimer * this.coreGlowFrequency) + 1) / 2 * coreGlowAlphaRange;
            
            // Approximate position of the core (center of the blue swirl)
            const coreOffsetX = 0; 
            const coreOffsetY = -this.height * 0.05; // Slightly above center of missile body
            const coreRadius = this.width * 0.2;

            ctx.fillStyle = `rgba(173, 216, 230, ${currentCoreGlowAlpha})`; // Light Blueish glow
            ctx.beginPath();
            ctx.arc(coreOffsetX, coreOffsetY, coreRadius, 0, Math.PI * 2);
            ctx.fill();

        } else { // Fallback drawing
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height / 2);
            ctx.lineTo(0, -this.height / 2 - 5); 
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
     getBoundingBox() { 
        // Simple AABB for now, could be improved with rotated collision if needed
        // For a rotated rectangle, collision is more complex. For now, use an approximate box.
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        // Use the larger dimension for a slightly more generous square box for simplicity
        const size = Math.max(this.width, this.height) * 0.8; // 80% of max dimension
        return {
            x: centerX - size / 2,
            y: centerY - size / 2,
            width: size,
            height: size
        };
    }
}