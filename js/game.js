// js/game.js
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId); 
        this.ctx = this.canvas.getContext('2d');
        this.width = 600; this.height = 400; 
        this.canvas.width = this.width; this.canvas.height = this.height;

        this.input = new InputHandler();
        this.uiManager = new UIManager(); 
        this.waveManager = new WaveManager(this); 
        this.collisionHandler = new CollisionHandler(this); 

        this.startMenuElement = document.getElementById('startMenu');
        this.startGameButton = document.getElementById('startGameButton');
        this.gameUIElements = document.getElementById('game-ui-elements'); // Wrapper for in-game UI

        this.gameOverElement = document.getElementById('gameOver');
        this.restartButton = document.getElementById('restartButton');
        
        this.setupEventListeners();

        this.lastTime = 0; this.screenShakeDuration = 0; this.screenShakeMagnitude = 5;
        this.isGameRunning = false; // To control the game loop
        
        // Initialize game elements but don't start the game loop yet
        this.prepareGame(); 
    }

    setupEventListeners() {
        this.startGameButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame()); // Restart also calls startGame
    }

    prepareGame() { // Sets up the game state without starting the loop
        this.player = new Player(this); 
        this.playerBullets = []; 
        this.playerMissiles = []; 
        this.enemyBullets = []; this.enemies = []; this.boss = null; 
        this.particles = []; this.powerUps = [];
        this.score = 0; this.lives = 3; 
        this.gameOver = false; this.isBossFightActive = false;
        
        this.waveManager.reset(); 
        this.waveManager.setBossSpawnThreshold(500); 
        
        this.enemySpawnTimer = 0; 
        this.powerUpSpawnTimer = 0; this.powerUpSpawnInterval = 7000; 
        this.powerUpTypes = ['rapid_fire', 'shield', 'spread_shot', 'homing_missiles', 'extra_life']; 

        this.uiManager.updateScore(this.score);
        this.uiManager.updateLives(this.lives);
        this.uiManager.hideGameOver();
        this.uiManager.showBossHealth(false);
        this.screenShakeDuration = 0;
    }

    startGame() {
        this.startMenuElement.style.display = 'none';
        this.canvas.style.display = 'block';
        this.gameUIElements.style.display = 'block'; // Show in-game UI
        this.uiManager.hideGameOver(); // Ensure game over is hidden

        this.prepareGame(); // Reset game state for a fresh start or restart
        this.isGameRunning = true;
        
        if (!this.gameLoopBound) this.gameLoopBound = this.gameLoop.bind(this);
        this.lastTime = performance.now(); 
        requestAnimationFrame(this.gameLoopBound);
    }


    reset() { // This is now effectively what prepareGame does, startGame will call it
        this.prepareGame();
        // The actual display changes and loop start are handled by startGame
        // If reset is called from game over, we need to show start menu again.
        this.startMenuElement.style.display = 'block';
        this.canvas.style.display = 'none';
        this.gameUIElements.style.display = 'none';
        this.isGameRunning = false;
    }

    addPlayerBullet(bullet) { this.playerBullets.push(bullet); }
    addPlayerMissile(missile) { this.playerMissiles.push(missile); } 
    addEnemyBullet(bullet) { this.enemyBullets.push(bullet); }
    createExplosion(x,y,c,cnt=15,sM=1){for(let i=0;i<cnt;i++){const p=new Particle(x,y,c,this);p.size*=sM;this.particles.push(p);}}
    triggerScreenShake(m=5,dF=15){this.screenShakeMagnitude=m;this.screenShakeDuration=dF;}

    spawnEnemy() { /* ... unchanged ... */ if(this.player.isDying||this.gameOver||this.isBossFightActive)return;const r=Math.random();let cC=0;cC+=this.waveManager.kamikazeSpawnChance;if(r<cC){this.enemies.push(new KamikazeEnemy(this));return;}cC+=this.waveManager.shootingEnemySpawnChance;if(r<cC)this.enemies.push(new ShootingEnemy(this));else if(r<cC+this.waveManager.chaserSpawnChance)this.enemies.push(new ChaserEnemy(this));else this.enemies.push(new BasicEnemy(this));}
    trySpawnBoss(){if(this.isBossFightActive||this.boss||this.player.isDying||this.gameOver)return;if(this.waveManager.canSpawnBoss(this.score)){this.boss=new BossEnemy(this);this.isBossFightActive=true;this.waveManager.markBossSpawnedForWave();this.enemies.forEach(e=>e.markedForDeletion=true);}}
    nextWave(){this.waveManager.nextWave();if(this.lives<3)this.lives++;this.uiManager.updateLives(this.lives);this.spawnPowerUp();}
    spawnPowerUp(){if(this.player.isDying||this.gameOver)return;const x=Math.random()*(this.width-20)+10,y=-20;const rT=this.powerUpTypes[Math.floor(Math.random()*this.powerUpTypes.length)];this.powerUps.push(new PowerUp(this,x,y,rT));}
    handlePlayerHitByEnemy(e){if(this.player.isDying||this.gameOver||this.player.shieldActive)return;let dA=1;if(e instanceof KamikazeEnemy)dA=e.damageToPlayer;this.lives-=dA;this.uiManager.updateLives(this.lives);this.triggerScreenShake(8,20);if(this.player.rapidFireActive)this.player.deactivateRapidFire();if(this.player.spreadShotActive)this.player.deactivateSpreadShot();if(this.lives<=0)this.player.startDeathAnimation();}
    handlePlayerHitByBoss(b){if(this.player.isDying||this.gameOver||this.player.shieldActive)return;this.lives--;this.uiManager.updateLives(this.lives);this.triggerScreenShake(12,25);this.createExplosion(this.player.x+this.player.width/2,this.player.y+this.player.height/2,'#FF0000',30,1);if(this.player.rapidFireActive)this.player.deactivateRapidFire();if(this.player.spreadShotActive)this.player.deactivateSpreadShot();if(this.lives<=0)this.player.startDeathAnimation();}
    handlePlayerHitByEnemyBullet(b){if(this.player.isDying||this.gameOver)return true;if(this.player.shieldActive){this.createExplosion(b.x,b.y,'#00FFFF',8,0.7);return true;}this.lives--;this.uiManager.updateLives(this.lives);this.triggerScreenShake(6,15);this.createExplosion(this.player.x+this.player.width/2,this.player.y+this.player.height/2,'#FF8C00',15,0.8);if(this.player.rapidFireActive)this.player.deactivateRapidFire();if(this.player.spreadShotActive)this.player.deactivateSpreadShot();if(this.lives<=0)this.player.startDeathAnimation();return false;}
    handleEnemyReachedBottom(e){if(this.player.isDying||this.gameOver)return;if(e instanceof BasicEnemy||e instanceof ChaserEnemy)this.handlePlayerHitByEnemy(e);}
    bossDefeated(){if(!this.isBossFightActive&&!this.boss)return;this.uiManager.showBossHealth(false);this.score+=this.boss?this.boss.scoreValue:500;this.uiManager.updateScore(this.score);this.boss=null;this.isBossFightActive=false;this.nextWave();}

    update(deltaTime) {
        if(!this.isGameRunning && !this.gameOver) return; // Don't update if game hasn't started (and not game over)
        if(this.gameOver&&!this.player.isDying&&!this.player.deathAnimationComplete){if(this.player.deathAnimationTimer<this.player.deathAnimationDuration)this.player.isDying=true;}
        this.player.update(this.input,deltaTime);
        if(this.player.deathAnimationComplete&&!this.gameOver)this.endGame();
        for(let i=this.particles.length-1;i>=0;i--){this.particles[i].update(deltaTime);if(!this.particles[i].isAlive())this.particles.splice(i,1);}
        for(let i=this.playerBullets.length-1;i>=0;i--){this.playerBullets[i].update(deltaTime);if(this.playerBullets[i].y+this.playerBullets[i].height<0)this.playerBullets.splice(i,1);}
        for(let i=this.playerMissiles.length-1;i>=0;i--){this.playerMissiles[i].update(deltaTime);if(this.playerMissiles[i].markedForDeletion)this.playerMissiles.splice(i,1);} 
        for(let i=this.enemyBullets.length-1;i>=0;i--){this.enemyBullets[i].update(deltaTime);if(this.enemyBullets[i].y>this.height+20||this.enemyBullets[i].y<-20||this.enemyBullets[i].x<-20||this.enemyBullets[i].x>this.width+20)this.enemyBullets.splice(i,1);}
        if(this.gameOver||this.player.isDying){if(this.player.isDying&&!this.gameOver){if(this.boss)this.boss.update(deltaTime);for(let i=this.enemies.length-1;i>=0;i--){this.enemies[i].update(deltaTime);if(this.enemies[i].markedForDeletion)this.enemies.splice(i,1);}}return;}
        this.trySpawnBoss();
        if(this.boss)this.boss.update(deltaTime);
        if(!this.isBossFightActive||(this.boss&&this.boss.state==='entering')){for(let i=this.powerUps.length-1;i>=0;i--){this.powerUps[i].update(deltaTime);if(this.powerUps[i].y>this.height)this.powerUps.splice(i,1);}this.enemySpawnTimer+=deltaTime;if(this.enemySpawnTimer>this.waveManager.enemySpawnInterval){this.spawnEnemy();this.enemySpawnTimer=0;}this.powerUpSpawnTimer+=deltaTime;if(this.powerUpSpawnTimer>this.powerUpSpawnInterval){this.spawnPowerUp();this.powerUpSpawnTimer=0;}for(let i=this.enemies.length-1;i>=0;i--){this.enemies[i].update(deltaTime);if(this.enemies[i].markedForDeletion)this.enemies.splice(i,1);}}
        else if(this.isBossFightActive&&this.boss&&this.boss.state==='fighting'){this.powerUpSpawnTimer+=deltaTime;if(this.powerUpSpawnTimer>this.powerUpSpawnInterval){this.spawnPowerUp();this.powerUpSpawnTimer=0;}for(let i=this.powerUps.length-1;i>=0;i--){this.powerUps[i].update(deltaTime);if(this.powerUps[i].y>this.height)this.powerUps.splice(i,1);}}
        this.collisionHandler.checkAllCollisions();
    }

    draw() {
        if(!this.isGameRunning && !this.gameOver && !this.startMenuElement.checkVisibility()) {
             // If game not running, not game over, and start menu isn't visible (e.g. initial load before main.js runs)
             // then don't attempt to draw game elements yet. This might be overly cautious.
             // The primary control is hiding the canvas.
        }

        this.ctx.save();
        if(this.isGameRunning || this.gameOver) { // Only apply shake if game is active or game over screen is showing
            if(this.screenShakeDuration>0){const sX=(Math.random()-0.5)*2*this.screenShakeMagnitude,sY=(Math.random()-0.5)*2*this.screenShakeMagnitude;this.ctx.translate(sX,sY);if(!this.player.isDying)this.screenShakeDuration--;else if(this.screenShakeDuration>0&&this.player.isDying)this.screenShakeDuration--;}
        }
        this.ctx.clearRect(-this.screenShakeMagnitude,-this.screenShakeMagnitude,this.width+this.screenShakeMagnitude*2,this.height+this.screenShakeMagnitude*2);
        
        if(this.isGameRunning || this.gameOver) { // Only draw game elements if game has started or is over
            this.player.draw(this.ctx);
            this.playerBullets.forEach(b=>b.draw(this.ctx));
            this.playerMissiles.forEach(m=>m.draw(this.ctx)); 
            this.enemyBullets.forEach(b=>b.draw(this.ctx));
            if(this.boss)this.boss.draw(this.ctx);
            if(!this.isBossFightActive||(this.boss&&this.boss.state==='entering'))this.enemies.forEach(e=>e.draw(this.ctx));
            if(!(this.gameOver&&this.player.deathAnimationComplete))this.powerUps.forEach(p=>p.draw(this.ctx));
            this.particles.forEach(p=>p.draw(this.ctx));
        }
        this.ctx.restore();

        if(this.gameOver)this.uiManager.showGameOver(this.score);
    }

    gameLoop(timestamp){
        if (!this.isGameRunning && !this.gameOver) {
            // If game is not running (e.g. on start menu) and not game over, don't run the loop logic.
            // We might still request another frame if we want menu animations later, but for now, stop.
            // However, the initial call in startGame will start it.
            // This check is mainly for when reset is called from game over, which sets isGameRunning to false.
            return; 
        }

        const dT=timestamp-(this.lastTime || timestamp); // Ensure lastTime is initialized
        this.lastTime=timestamp;
        const cDT=Math.min(dT,100);
        
        this.update(cDT);
        this.draw();

        if(this.isGameRunning || (this.player && this.player.isDying) || (this.boss && !this.boss.markedForDeletion)) {
            requestAnimationFrame(this.gameLoopBound);
        }
    }
    endGame(){if(this.gameOver)return;this.gameOver=true;this.isGameRunning=false;if(this.player.rapidFireActive)this.player.deactivateRapidFire();if(this.player.shieldActive)this.player.deactivateShield();if(this.player.spreadShotActive)this.player.deactivateSpreadShot();this.uiManager.showBossHealth(false);}
    // Start method is now effectively startGame, which also resets.
    // start(){ this.reset(); } // This was the old one
}