// js/player.js
class Player {
    constructor(game) {
        this.game = game;
        this.image = document.getElementById('playerSprite');
        this.width = 55; this.height = 55; 
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 10;
        this.speed = 7;
        
        this.originalShootCooldown = 200;
        this.shootCooldown = this.originalShootCooldown;
        this.lastShotTime = 0;

        this.isShooting = false; this.shootAnimationTime = 0; this.shootAnimationDuration = 80; 
        this.muzzleFlashDuration = 60; 
        this.isTurningLeft = false; this.isTurningRight = false; this.turnAngle = 0.18; 
        this.idleAnimationTimer = Math.random() * 1000; 
        this.isDying = false; this.deathAnimationTimer = 0; this.deathAnimationDuration = 1200; 
        this.deathAnimationComplete = false; this.deathSpinDirection = Math.random() < 0.5; 

        this.rapidFireActive = false; this.rapidFireEndTime = 0;
        this.rapidFireAuraColor = 'rgba(255, 215, 0, 0.35)'; this.rapidFireAuraPulseTime = 0;
        this.shieldActive = false; this.shieldEndTime = 0;
        this.shieldAuraColor = 'rgba(0, 255, 255, 0.3)'; this.shieldPulseTime = 0;
        this.spreadShotActive = false; this.spreadShotEndTime = 0;
        this.spreadAngle = Math.PI / 12; 

        this.homingMissilesAmmo = 0;
        this.maxHomingMissiles = 5; // Can hold up to 5
        this.homingMissileCooldown = 800; // ms
        this.lastHomingMissileTime = 0;
    }

    update(input, deltaTime) {
        this.idleAnimationTimer += deltaTime;
        if (this.rapidFireActive) this.rapidFireAuraPulseTime += deltaTime;
        if (this.shieldActive) this.shieldPulseTime += deltaTime;

        if (this.isDying) {
            this.deathAnimationTimer += deltaTime;
            if (this.deathAnimationTimer >= this.deathAnimationDuration) {
                this.deathAnimationComplete = true; this.isDying = false; 
            } return; 
        }

        const normalizedSpeed = this.speed * (deltaTime / (1000 / 60));
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('a')) { this.x -= normalizedSpeed; this.isTurningLeft = true; this.isTurningRight = false; } 
        else if (input.isKeyDown('ArrowRight') || input.isKeyDown('d')) { this.x += normalizedSpeed; this.isTurningRight = true; this.isTurningLeft = false; } 
        else { this.isTurningLeft = false; this.isTurningRight = false; }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;

        const currentTime = performance.now();
        if (this.rapidFireActive && currentTime > this.rapidFireEndTime) this.deactivateRapidFire();
        if (this.shieldActive && currentTime > this.shieldEndTime) this.deactivateShield();
        if (this.spreadShotActive && currentTime > this.spreadShotEndTime) this.deactivateSpreadShot();

        // Primary Fire
        if ((input.isKeyDown(' ') || input.isKeyDown('ArrowUp') || input.isKeyDown('w')) && 
            (currentTime - this.lastShotTime > this.shootCooldown)) {
            this.shootPrimary(); this.lastShotTime = currentTime; this.isShooting = true; this.shootAnimationTime = 0;
        }
        // Secondary Fire (Homing Missiles) - Using 'x' or 'Shift'
        if ((input.isKeyDown('x') || input.isKeyDown('Shift')) && this.homingMissilesAmmo > 0 &&
            (currentTime - this.lastHomingMissileTime > this.homingMissileCooldown)) {
            this.shootHomingMissile(); this.lastHomingMissileTime = currentTime;
        }


        if (this.isShooting) {
            this.shootAnimationTime += deltaTime;
            if (this.shootAnimationTime >= this.shootAnimationDuration) this.isShooting = false;
        }
    }

    shootPrimary() {
        const bulletOriginX = this.x + this.width / 2;
        const bulletOriginY = this.y + (this.height * 0.1); 
        if (this.spreadShotActive) {
            this.game.addPlayerBullet(new PlayerBullet(bulletOriginX, bulletOriginY, this.game));
            const leftBullet = new PlayerBullet(bulletOriginX, bulletOriginY, this.game); leftBullet.angle = -this.spreadAngle; this.game.addPlayerBullet(leftBullet);
            const rightBullet = new PlayerBullet(bulletOriginX, bulletOriginY, this.game); rightBullet.angle = this.spreadAngle; this.game.addPlayerBullet(rightBullet);
        } else {
            this.game.addPlayerBullet(new PlayerBullet(bulletOriginX, bulletOriginY, this.game));
        }
    }

    shootHomingMissile() {
        if (this.homingMissilesAmmo > 0) {
            const missileOriginX = this.x + this.width / 2;
            const missileOriginY = this.y; // From top of ship
            this.game.addPlayerMissile(new PlayerHomingMissile(missileOriginX, missileOriginY, this.game));
            this.homingMissilesAmmo--;
            // Add a visual/audio cue for missile launch if desired
            this.game.createExplosion(missileOriginX, missileOriginY, '#FFA500', 8, 0.7);
        }
    }
    
    addHomingMissiles(amount) {
        this.homingMissilesAmmo = Math.min(this.maxHomingMissiles, this.homingMissilesAmmo + amount);
    }

    addLifeOrScore() {
        if (this.game.lives < 3) { // Assuming 3 is max lives
            this.game.lives++;
            this.game.uiManager.updateLives(this.game.lives);
        } else {
            this.game.score += 250; // Bonus score if at max lives
            this.game.uiManager.updateScore(this.game.score);
        }
    }


    activateRapidFire(duration) { this.deactivateSpreadShot(); this.rapidFireActive = true; this.shootCooldown = 70; this.rapidFireEndTime = performance.now() + duration; this.rapidFireAuraPulseTime = 0; }
    deactivateRapidFire() { this.rapidFireActive = false; if (!this.spreadShotActive) this.shootCooldown = this.originalShootCooldown; }
    activateShield(duration) { this.shieldActive = true; this.shieldEndTime = performance.now() + duration; this.shieldPulseTime = 0; }
    deactivateShield() { this.shieldActive = false; }
    activateSpreadShot(duration) { this.deactivateRapidFire(); this.spreadShotActive = true; this.shootCooldown = this.originalShootCooldown * 1.25; this.spreadShotEndTime = performance.now() + duration; }
    deactivateSpreadShot() { this.spreadShotActive = false; if (!this.rapidFireActive) this.shootCooldown = this.originalShootCooldown; }

    startDeathAnimation() {
        if (this.isDying) return; 
        this.isDying = true; this.deathAnimationTimer = 0; this.deathAnimationComplete = false;
        this.deactivateRapidFire(); this.deactivateShield(); this.deactivateSpreadShot();
        this.homingMissilesAmmo = 0; // Lose missiles on death
        this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#FFA500', 40); 
        this.game.createExplosion(this.x + this.width / 2, this.y + this.height / 2, '#FF4500', 30); 
        this.game.triggerScreenShake(10, 30); 
    }

    draw(ctx) {
        if (this.deathAnimationComplete && !this.isDying) return;
        let currentDrawY = this.y;
        if (!this.isDying && this.isShooting) { const p = this.shootAnimationTime / this.shootAnimationDuration; currentDrawY -= 4 * Math.sin(p * Math.PI); }
        ctx.save();
        const cX = this.x + this.width / 2, cY = currentDrawY + this.height / 2;
        ctx.translate(cX, cY);
        if (this.isDying) { const p = this.deathAnimationTimer / this.deathAnimationDuration; ctx.rotate(p * Math.PI*2.5*(this.deathSpinDirection?1:-1)); const s=Math.max(0,1-p*1.2); ctx.scale(s,s); ctx.globalAlpha=Math.max(0,1-p*1.1); }
        else { const iS=Math.sin(this.idleAnimationTimer*0.0025)*0.02; ctx.scale(1+iS,1+iS); if(this.isTurningLeft) ctx.rotate(-this.turnAngle); else if(this.isTurningRight) ctx.rotate(this.turnAngle); }
        if (!this.isDying && this.shieldActive) { const sBS=this.width*0.85, sP=Math.sin(this.shieldPulseTime*0.006)*(this.width*0.1),sS=sBS+sP; ctx.fillStyle=this.shieldAuraColor; ctx.beginPath(); ctx.ellipse(0,0,sS,sS,0,0,Math.PI*2); ctx.fill(); }
        if (!this.isDying && this.rapidFireActive) { const aBS=this.width*0.75,aP=Math.sin(this.rapidFireAuraPulseTime*0.005)*(this.width*0.08),aS=aBS+aP; ctx.fillStyle=this.rapidFireAuraColor;ctx.beginPath();ctx.ellipse(0,0,aS,aS,0,0,Math.PI*2);ctx.fill(); }
        if (!this.isDying && this.shieldActive) { ctx.save(); ctx.globalCompositeOperation='source-atop'; ctx.fillStyle='rgba(0,150,150,0.25)'; ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height); ctx.restore(); }
        if (!this.isDying && this.spreadShotActive) { const cGS=this.width*0.1,cOX=this.width*0.35,cOY=this.height*0.15; ctx.fillStyle='rgba(200,0,255,0.6)'; ctx.beginPath();ctx.arc(-cOX,cOY,cGS,0,Math.PI*2);ctx.fill(); ctx.beginPath();ctx.arc(cOX,cOY,cGS,0,Math.PI*2);ctx.fill(); }
        if (this.image.complete && this.image.naturalHeight !== 0) ctx.drawImage(this.image,-this.width/2,-this.height/2,this.width,this.height); else { ctx.fillStyle='#0099FF';ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height); }
        if (!this.isDying && this.isShooting && this.shootAnimationTime < this.muzzleFlashDuration) { ctx.fillStyle='rgba(255,255,150,0.8)'; const fS=this.width*0.25; ctx.beginPath(); ctx.arc(0,-this.height*0.35,fS*(1-(this.shootAnimationTime/this.muzzleFlashDuration)),0,Math.PI*2); ctx.fill(); }
        // Draw missile ammo count if any
        if (!this.isDying && this.homingMissilesAmmo > 0) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`M: ${this.homingMissilesAmmo}`, this.width / 2 - 5, -this.height / 2 + 12);
        }
        ctx.restore();
    }
}