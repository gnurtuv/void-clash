// js/collisionHandler.js
class CollisionHandler {
    constructor(game) { this.game = game; }

    handlePlayerProjectilesVsEnemies() { // Now handles both bullets and missiles
        // Player Bullets vs Enemies
        for (let j = this.game.playerBullets.length - 1; j >= 0; j--) {
            const pBullet = this.game.playerBullets[j];
            if (!pBullet) continue;
            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const enemy = this.game.enemies[i];
                if (!enemy || enemy.markedForDeletion) continue;
                if (checkCollision(pBullet, enemy)) {
                    this.game.playerBullets.splice(j, 1); 
                    this.game.createExplosion(pBullet.x, pBullet.y, enemy.color, 3, 0.5); 
                    if (enemy.takeDamage(1)) { 
                        this.game.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color); 
                        this.game.score += enemy.scoreValue; this.game.uiManager.updateScore(this.game.score);
                    } break; 
                }
            }
        }
        // Player Missiles vs Enemies
        for (let j = this.game.playerMissiles.length - 1; j >= 0; j--) {
            const pMissile = this.game.playerMissiles[j];
            if (!pMissile || pMissile.markedForDeletion) continue;
            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const enemy = this.game.enemies[i];
                if (!enemy || enemy.markedForDeletion) continue;
                if (checkCollision(pMissile.getBoundingBox(), enemy)) { // Use missile's bounding box
                    pMissile.markedForDeletion = true; 
                    this.game.createExplosion(pMissile.x + pMissile.width/2, pMissile.y + pMissile.height/2, enemy.color, 20, 1.2); // Bigger explosion
                    if (enemy.takeDamage(pMissile.damage)) { 
                        this.game.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 30); 
                        this.game.score += enemy.scoreValue; this.game.uiManager.updateScore(this.game.score);
                    } break; 
                }
            }
        }
    }

    handlePlayerProjectilesVsBoss() { // Now handles both bullets and missiles
        if (!this.game.boss || this.game.boss.state !== 'fighting') return;
        // Player Bullets vs Boss
        for (let j = this.game.playerBullets.length - 1; j >= 0; j--) {
            const pBullet = this.game.playerBullets[j];
            if (!pBullet) continue;
            if (checkCollision(pBullet, this.game.boss)) { 
                this.game.playerBullets.splice(j, 1); this.game.boss.takeDamage(1); 
                this.game.createExplosion(pBullet.x, pBullet.y, '#FFD700', 5, 0.6); break; 
            }
        }
        // Player Missiles vs Boss
        for (let j = this.game.playerMissiles.length - 1; j >= 0; j--) {
            const pMissile = this.game.playerMissiles[j];
            if (!pMissile || pMissile.markedForDeletion) continue;
            if (checkCollision(pMissile.getBoundingBox(), this.game.boss)) {
                pMissile.markedForDeletion = true;
                this.game.boss.takeDamage(pMissile.damage);
                this.game.createExplosion(pMissile.x + pMissile.width/2, pMissile.y + pMissile.height/2, '#FFA500', 25, 1.5); // Big missile hit
                break;
            }
        }
    }

    handleEnemyBulletsVsPlayer(){for(let i=this.game.enemyBullets.length-1;i>=0;i--){const eB=this.game.enemyBullets[i];if(!eB)continue;if(checkCollision(this.game.player,eB.getBoundingBox())){this.game.handlePlayerHitByEnemyBullet(eB);this.game.enemyBullets.splice(i,1);if(this.game.player.isDying||this.game.gameOver)return true;}}return false;}
    handlePlayerVsEnemies(){for(let i=this.game.enemies.length-1;i>=0;i--){const e=this.game.enemies[i];if(!e||e.markedForDeletion)continue;if(checkCollision(this.game.player,e)){if(e instanceof KamikazeEnemy){e.explode();if(!this.game.player.shieldActive)this.game.handlePlayerHitByEnemy(e);else{this.game.createExplosion(this.game.player.x+this.game.player.width/2,this.game.player.y+this.game.player.height/2,this.game.player.shieldAuraColor,10,0.8);this.game.score+=e.scoreValue;this.game.uiManager.updateScore(this.game.score);}}else{if(!this.game.player.shieldActive){this.game.createExplosion(e.x+e.width/2,e.y+e.height/2,e.color,20);this.game.handlePlayerHitByEnemy(e);if(e.takeDamage(100)){this.game.score+=e.scoreValue;this.game.uiManager.updateScore(this.game.score);}}else{this.game.createExplosion(e.x+e.width/2,e.y+e.height/2,e.color,20);this.game.createExplosion(this.game.player.x+this.game.player.width/2,this.game.player.y+this.game.player.height/2,this.game.player.shieldAuraColor,10,0.8);if(e.takeDamage(100)){this.game.score+=e.scoreValue;this.game.uiManager.updateScore(this.game.score);}}}if(!e.markedForDeletion)e.markedForDeletion=true;if(this.game.player.isDying||this.game.gameOver)return true;}}return false;}
    handlePlayerVsBoss(){if(this.game.boss&&this.game.boss.state==='fighting'&&checkCollision(this.game.player,this.game.boss)){this.game.handlePlayerHitByBoss(this.game.boss);if(this.game.player.isDying||this.game.gameOver)return true;}return false;}
    handlePlayerVsPowerUps(){for(let i=this.game.powerUps.length-1;i>=0;i--){const pU=this.game.powerUps[i];if(checkCollision(this.game.player,pU.getBoundingBox())){pU.applyEffect(this.game.player);this.game.powerUps.splice(i,1);}}}

    checkAllCollisions() {
        if(this.handleEnemyBulletsVsPlayer()) return; 
        if(this.handlePlayerVsEnemies()) return;
        if(this.handlePlayerVsBoss()) return;
        this.handlePlayerProjectilesVsEnemies(); // Updated method name
        this.handlePlayerProjectilesVsBoss();   // Updated method name
        this.handlePlayerVsPowerUps(); 
    }
}