// js/powerup.js
class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x; 
        this.y = y; 
        this.type = type; 
        this.speedY = 1.5;
        this.collected = false;
        this.animationTimer = Math.random() * 2000; 

        this.image = null; 
        this.bobAmplitude = 2; 
        this.bobFrequency = 0.003; 
        this.glowMinAlpha = 0.1;
        this.glowMaxAlpha = 0.5;
        this.glowFrequency = 0.004;
        this.color = '#FFFFFF'; 

        if (this.type === 'rapid_fire') {
            this.image = document.getElementById('powerUpRapidFireSprite');
            this.width = 28; this.height = 35; this.duration = 7000; 
            this.glowColor = 'rgba(255, 165, 0, 0.5)'; 
        } else if (this.type === 'shield') {
            this.image = document.getElementById('powerUpShieldSprite');
            this.width = 32; this.height = 32; this.duration = 8000; 
            this.bobAmplitude = 2.5; this.bobFrequency = 0.0025; 
            this.glowMinAlpha = 0.2; this.glowMaxAlpha = 0.6; this.glowFrequency = 0.0035;
            this.glowColor = 'rgba(0, 200, 255, 0.5)'; 
            this.spriteSourceX = 0; this.spriteSourceY = 0; 
            this.spriteSourceWidth = 1014; this.spriteSourceHeight = 1526; 
        } else if (this.type === 'spread_shot') {
            this.image = document.getElementById('powerUpSpreadShotSprite');
            this.width = 30; this.height = 35; this.duration = 10000; 
            this.glowColor = 'rgba(100, 220, 100, 0.5)'; 
            this.bobFrequency = 0.0028; this.glowFrequency = 0.0038;
        } else if (this.type === 'homing_missiles') {
            this.image = document.getElementById('powerUpHomingMissilesSprite');
            this.width = 32; this.height = 32; 
            this.ammoCount = 3; 
            this.glowColor = 'rgba(255, 100, 220, 0.5)'; 
            this.bobFrequency = 0.0032; this.glowFrequency = 0.0042;
        } else if (this.type === 'extra_life') {
            this.image = document.getElementById('powerUpExtraLifeSprite');
            this.width = 30; // Adjusted for the new sprite
            this.height = 35; // Adjusted
            this.glowColor = 'rgba(255, 20, 147, 0.4)'; // DeepPinkish glow
            this.bobAmplitude = 1.5; // More subtle bob for this one
            this.bobFrequency = 0.002;
            this.glowFrequency = 0.005; // Slightly faster pulse for the glow
        }
    }

    update(deltaTime) {
        const dtFactor = deltaTime / (1000 / 60);
        this.y += this.speedY * dtFactor;
        this.animationTimer += deltaTime;

        // Particle trail specifically for shield (can be generalized if needed)
        if (this.type === 'shield' && Math.random() < 0.2) {
            const pX=this.x+(Math.random()-0.5)*this.width*0.5,pY=this.y+this.height*0.3;
            const p=new Particle(pX,pY,'rgba(0,220,255,0.6)',this.game);
            p.size=Math.random()*1.5+0.5;p.speedY=-0.5-Math.random()*0.5;p.speedX=(Math.random()-0.5)*0.5;p.lifeSpan=150+Math.random()*100;
            this.game.particles.push(p);
        } else if (this.type === 'extra_life' && Math.random() < 0.15) { // Sparkly trail for extra life
             const particleX = this.x + (Math.random() - 0.5) * this.width * 0.3;
            const particleY = this.y + (Math.random() - 0.5) * this.height * 0.3;
            const particle = new Particle(particleX, particleY, 'rgba(255, 215, 0, 0.7)', this.game); // Gold sparkles
            particle.size = Math.random() * 1 + 0.5;
            particle.speedY = -0.2 - Math.random() * 0.3; 
            particle.speedX = (Math.random() - 0.5) * 0.3;
            particle.lifeSpan = 100 + Math.random()*80;
            this.game.particles.push(particle);
        }
    }

    draw(ctx) {
        const bobOffset = Math.sin(this.animationTimer * this.bobFrequency) * this.bobAmplitude;
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2 + bobOffset;
        ctx.save();
        if (this.glowColor) { 
            const gAR=this.glowMaxAlpha-this.glowMinAlpha;const cGA=this.glowMinAlpha+(Math.sin(this.animationTimer*this.glowFrequency)+1)/2*gAR;
            ctx.fillStyle=this.glowColor.replace(/[\d\.]+\)$/g,`${cGA.toFixed(2)})`);
            const gP=5; const hP=(cX,cY,s)=>{let pts=[];for(let i=0;i<6;i++)pts.push({x:cX+s*Math.cos(i*Math.PI/3+Math.PI/6),y:cY+s*Math.sin(i*Math.PI/3+Math.PI/6)});return pts;};
            const gS=hP(this.x,this.y+bobOffset,(Math.max(this.width,this.height)/2)+gP);
            ctx.beginPath();ctx.moveTo(gS[0].x,gS[0].y);for(let i=1;i<gS.length;i++)ctx.lineTo(gS[i].x,gS[i].y);ctx.closePath();ctx.fill();
        }

        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
            if (this.type === 'shield' && this.spriteSourceWidth && this.spriteSourceHeight) {
                ctx.drawImage(this.image,this.spriteSourceX,this.spriteSourceY,this.spriteSourceWidth,this.spriteSourceHeight,drawX,drawY,this.width,this.height);
            } else { // For rapid_fire, spread_shot, homing_missiles, extra_life etc.
                ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
            }
        } else if (this.type === 'extra_life' && !this.image) { // Fallback if extra_life image fails
            ctx.fillStyle = this.color || '#32CD32'; 
            ctx.beginPath(); const s=this.width*0.45; 
            ctx.moveTo(this.x, this.y+bobOffset-s*0.2); 
            ctx.bezierCurveTo(this.x,this.y+bobOffset-s*0.6,this.x-s,this.y+bobOffset-s*0.6,this.x-s,this.y+bobOffset);
            ctx.bezierCurveTo(this.x-s,this.y+bobOffset+s*0.4,this.x,this.y+bobOffset+s*0.8,this.x,this.y+bobOffset+s*0.8);
            ctx.bezierCurveTo(this.x,this.y+bobOffset+s*0.8,this.x+s,this.y+bobOffset+s*0.4,this.x+s,this.y+bobOffset);
            ctx.bezierCurveTo(this.x+s,this.y+bobOffset-s*0.6,this.x,this.y+bobOffset-s*0.6,this.x,this.y+bobOffset-s*0.2);
            ctx.fill();
        } else { // Generic fallback for other types if their specific image fails
            ctx.fillStyle = this.color || '#DDDDDD';
            ctx.fillRect(drawX, drawY, this.width, this.height);
        }
        ctx.restore();
    }

    applyEffect(player) {
        if (this.type === 'rapid_fire') player.activateRapidFire(this.duration);
        else if (this.type === 'shield') player.activateShield(this.duration);
        else if (this.type === 'spread_shot') player.activateSpreadShot(this.duration);
        else if (this.type === 'homing_missiles') player.addHomingMissiles(this.ammoCount);
        else if (this.type === 'extra_life') player.addLifeOrScore();
    }

    getBoundingBox() { return { x:this.x-this.width/2, y:this.y-this.height/2, width:this.width, height:this.height }; }
}