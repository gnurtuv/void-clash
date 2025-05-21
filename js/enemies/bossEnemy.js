// js/enemies/bossEnemy.js
class BossEnemy extends Enemy {
    constructor(game) {
        super(game);
        this.game = game; 
        this.image = document.getElementById('bossEyeTyrantSprite');
        this.width = 160; this.height = 120; 
        this.x = this.game.width / 2 - this.width / 2; this.y = -this.height - 30; 
        this.baseHealth = 150; this.health = this.baseHealth; this.maxHealth = this.baseHealth; 
        this.scoreValue = 1000; this.color = '#8A2BE2'; 
        this.state = 'entering'; this.entrySpeed = 0.8; this.targetY = 50; 
        this.attackPhase = 0; this.attackPhaseTimer = 0; this.attackPhaseDuration = 6000; 
        this.spreadShotCooldown = 2000; this.lastSpreadShotTime = 0;
        this.spreadBulletCount = 7; this.spreadTotalAngle = Math.PI / 2.5; 
        this.barrageShotCount = 3; this.barrageShotInterval = 150; 
        this.barrageCooldown = 3000; this.lastBarrageStartTime = 0;
        this.shotsInCurrentBarrage = 0; this.timeSinceLastBarrageShot = 0;
        this.bulletSpeed = 3.8; 
        this.mainEyePulseFrequency = 0.004; this.mainEyePulseMinScale = 0.9; this.mainEyePulseMaxScale = 1.1;
        this.eyeStalkWiggleFrequency = 0.002; this.eyeStalkWiggleAmplitude = 0.05; 
        this.sideWingGlowFrequency = 0.003; this.sideWingGlowMinAlpha = 0.3; this.sideWingGlowMaxAlpha = 0.7;
        this.patrolDir = 1; this.patrolSpeed = 0.5;
        this.patrolMinX = 50; this.patrolMaxX = this.game.width - this.width - 50;
        this.deathAnimationTimer = 0; this.deathAnimationDuration = 2500; this.nextExplosionTime = 0;
    }

    waveHealthBonusFactor() { return 0; } 

    update(deltaTime) {
        super.update(deltaTime); 
        const dtFactor = deltaTime / (1000/60);
        if (this.state === 'entering') {
            this.y += this.entrySpeed * dtFactor;
            if (this.y >= this.targetY) {
                this.y = this.targetY; this.state = 'fighting';
                this.lastSpreadShotTime = performance.now() + 1000; 
                this.lastBarrageStartTime = performance.now() + this.attackPhaseDuration / 2; 
                this.attackPhaseTimer = 0; this.game.uiManager.showBossHealth(true, "Eye Tyrant"); 
            }
        } else if (this.state === 'fighting') {
            this.x += this.patrolSpeed * this.patrolDir * dtFactor;
            if ((this.x <= this.patrolMinX && this.patrolDir < 0) || (this.x >= this.patrolMaxX && this.patrolDir > 0)) this.patrolDir *= -1;
            this.attackPhaseTimer += deltaTime;
            if (this.attackPhaseTimer >= this.attackPhaseDuration) {
                this.attackPhase = (this.attackPhase + 1) % 2; this.attackPhaseTimer = 0;
                this.lastSpreadShotTime = performance.now() + 500; this.lastBarrageStartTime = performance.now() + 500;
                this.shotsInCurrentBarrage = 0;
            }
            const currentTime = performance.now();
            if (this.attackPhase === 0) { 
                if (currentTime - this.lastSpreadShotTime > this.spreadShotCooldown) { this.performSpreadShot(); this.lastSpreadShotTime = currentTime; }
            } else if (this.attackPhase === 1) { 
                this.timeSinceLastBarrageShot += deltaTime;
                if (this.shotsInCurrentBarrage < this.barrageShotCount && 
                    this.timeSinceLastBarrageShot >= this.barrageShotInterval &&
                    currentTime - this.lastBarrageStartTime > this.barrageCooldown) {
                    this.performTargetedShot(); this.timeSinceLastBarrageShot = 0; this.shotsInCurrentBarrage++;
                    if (this.shotsInCurrentBarrage >= this.barrageShotCount) { this.lastBarrageStartTime = currentTime; this.shotsInCurrentBarrage = 0; }
                } else if (this.shotsInCurrentBarrage >= this.barrageShotCount && currentTime - this.lastBarrageStartTime < this.barrageCooldown) { /* In cooldown */ } 
                else if (currentTime - this.lastBarrageStartTime > this.barrageCooldown) { this.shotsInCurrentBarrage = 0; }
            }
        } else if (this.state === 'dying') {
            this.deathAnimationTimer += deltaTime;
            if (this.deathAnimationTimer > this.nextExplosionTime) {
                const eX=this.x+Math.random()*this.width,eY=this.y+Math.random()*this.height,eS=0.5+Math.random()*1.5;
                this.game.createExplosion(eX,eY,this.color,10+Math.random()*10,eS);
                this.game.triggerScreenShake(5+Math.random()*5,10);
                this.nextExplosionTime = this.deathAnimationTimer+150+Math.random()*200; 
            }
            if (this.deathAnimationTimer >= this.deathAnimationDuration) { this.markedForDeletion = true; this.game.bossDefeated(); }
        }
    }

    performSpreadShot() {
        const oX=this.x+this.width/2,oY=this.y+this.height/2;
        const aS=this.spreadTotalAngle/(this.spreadBulletCount>1?this.spreadBulletCount-1:1);
        let cA=(Math.PI/2)-(this.spreadTotalAngle/2); 
        for(let i=0;i<this.spreadBulletCount;i++){const b=new EnemyBullet(oX,oY,this.game);b.setDirection(cA,this.bulletSpeed);this.game.addEnemyBullet(b);if(this.spreadBulletCount>1)cA+=aS;}
        this.game.createExplosion(oX,oY,'#FF8C00',8,0.7); 
    }

    performTargetedShot() {
        if (!this.game.player || this.game.player.isDying) return;
        const oX=this.x+this.width/2,oY=this.y+this.height/2;
        let pCX=this.game.player.x+this.game.player.width/2;
        let pCY=this.game.player.y+this.game.player.height/2;

        // Simple lead prediction: estimate player's future position
        // This assumes player continues in their current direction for a short time.
        // A more advanced prediction would use player's current velocity vector.
        // For simplicity, if player is moving, aim slightly ahead.
        const leadFactor = 0.2; // How much to lead (adjust for difficulty)
        const timeToInterceptApprox = Math.sqrt(Math.pow(pCX-oX,2)+Math.pow(pCY-oY,2)) / (this.bulletSpeed * 1.1 * 60 / 1000); // Approx time in ms for bullet to reach

        if(this.game.input.isKeyDown('ArrowLeft') || this.game.input.isKeyDown('a')) pCX -= this.game.player.speed * leadFactor * (timeToInterceptApprox / 16); // Approx player speed units
        if(this.game.input.isKeyDown('ArrowRight') || this.game.input.isKeyDown('d')) pCX += this.game.player.speed * leadFactor * (timeToInterceptApprox / 16);
        // No vertical leading in this simple version as player mostly moves horizontally.

        const angleToPlayer = Math.atan2(pCY-oY,pCX-oX);
        const bullet = new EnemyBullet(oX,oY,this.game);
        bullet.setDirection(angleToPlayer,this.bulletSpeed*1.1);
        this.game.addEnemyBullet(bullet);
        this.game.createExplosion(oX,oY,'#FF4500',5,0.6); 
    }

    takeDamage(amount) {
        if (this.state !== 'fighting') return false; 
        this.health -= amount; this.game.uiManager.updateBossHealthBar(this.health / this.maxHealth);
        this.hitTimer = this.hitFlashDuration; 
        if (this.health <= 0) {
            this.health = 0; this.state = 'dying'; this.deathAnimationTimer = 0; this.nextExplosionTime = 0;
            this.game.uiManager.showBossHealth(true,"CRITICAL DAMAGE"); this.game.uiManager.updateBossHealthBar(0); 
            return true;
        } return false;
    }
    draw(ctx){ /* Minified version from previous correct response */ ctx.save();let cX=this.x,cY=this.y,oA=1.0,sF=1.0;if(this.state==='dying'){const p=this.deathAnimationTimer/this.deathAnimationDuration;oA=1.0-Math.pow(p,2);cX+=(Math.random()-0.5)*15*p;cY+=(Math.random()-0.5)*15*p;sF=1+0.3*p;ctx.globalAlpha=oA;}else if(this.hitTimer>0&&this.state==='fighting'){const p=(this.hitFlashDuration-this.hitTimer)/this.hitFlashDuration;sF=1+(this.hitScaleEffect-1)*Math.sin(p*Math.PI);}ctx.translate(cX+this.width/2,cY+this.height/2);ctx.scale(sF,sF);const wOXB=Math.sin(this.animationTimer*this.eyeStalkWiggleFrequency*1.5)*2;const wOYB=Math.cos(this.animationTimer*this.eyeStalkWiggleFrequency)*1.5;const dWF=(this.state==='dying'?(1-(this.deathAnimationTimer/this.deathAnimationDuration)):1);const wOX=wOXB*dWF;const wOY=wOYB*dWF;ctx.translate(wOX-(cX+this.width/2),wOY-(cY+this.height/2));if(this.image&&this.image.complete&&this.image.naturalHeight!==0){ctx.drawImage(this.image,cX,cY,this.width,this.height);if(this.hitTimer>0&&this.state==='fighting'){ctx.globalCompositeOperation='source-atop';const fA=0.3*(this.hitTimer/this.hitFlashDuration)+0.2;ctx.fillStyle=`rgba(255,180,180,${fA})`;ctx.fillRect(cX,cY,this.width,this.height);}}else{const bF=this.hitTimer>0&&this.state==='fighting'?`rgba(200,0,100,${0.6+0.2*(this.hitTimer/this.hitFlashDuration)})`:this.color;ctx.fillStyle=bF;ctx.fillRect(cX,cY,this.width,this.height);ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(cX+this.width/2,cY+this.height/2,this.width*0.2,0,Math.PI*2);ctx.fill();}ctx.globalCompositeOperation='source-over';if(this.state==='dying')ctx.globalAlpha=oA;if(this.state!=='dying'||this.deathAnimationTimer<this.deathAnimationDuration*0.8){const wGAR=this.sideWingGlowMaxAlpha-this.sideWingGlowMinAlpha;let cWGA=this.sideWingGlowMinAlpha+(Math.sin(this.animationTimer*this.sideWingGlowFrequency)+1)/2*wGAR;if(this.hitTimer>0&&this.state==='fighting')cWGA*=0.5;ctx.fillStyle=`rgba(255,140,0,${cWGA*oA})`;const wR=this.width*0.15;const lWDX=cX+this.width*0.1;const rWDX=cX+this.width*0.9;const wDY=cY+this.height*0.5;ctx.beginPath();ctx.arc(lWDX,wDY,wR,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(rWDX,wDY,wR,0,Math.PI*2);ctx.fill();}ctx.restore();}
}