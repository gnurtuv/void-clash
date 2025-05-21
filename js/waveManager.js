// js/waveManager.js
class WaveManager {
    constructor(game) {
        this.game = game; 
        this.waveNumber = 1;
        
        this.baseEnemySpawnInterval = 1500; 
        this.minEnemySpawnInterval = 250;  
        this.enemySpawnIntervalReductionPerWave = 50; // How much interval decreases per wave
        this.enemySpawnInterval = this.baseEnemySpawnInterval;
        
        this.baseChaserSpawnChance = 0.10;
        this.chaserSpawnChance = this.baseChaserSpawnChance;
        this.baseShootingEnemySpawnChance = 0.05;
        this.shootingEnemySpawnChance = this.baseShootingEnemySpawnChance;
        this.baseKamikazeSpawnChance = 0.03; 
        this.kamikazeSpawnChance = this.baseKamikazeSpawnChance;

        this.bossSpawnScoreThreshold = 500; 
        this.bossScoreIncrement = 750;
        this.bossActiveThisWave = false;
    }

    reset() {
        this.waveNumber = 1;
        this.enemySpawnInterval = this.baseEnemySpawnInterval;
        this.chaserSpawnChance = this.baseChaserSpawnChance;
        this.shootingEnemySpawnChance = this.baseShootingEnemySpawnChance;
        this.kamikazeSpawnChance = this.baseKamikazeSpawnChance;
        this.bossActiveThisWave = false;
        if (this.game.uiManager) { 
            this.game.uiManager.updateWave(this.waveNumber);
        }
    }
    
    setBossSpawnThreshold(threshold) {
        this.bossSpawnScoreThreshold = threshold;
    }

    nextWave() {
        this.waveNumber++;
        if(this.game.uiManager) this.game.uiManager.updateWave(this.waveNumber); // Check uiManager exists
        
        this.bossActiveThisWave = false; 

        // Decrease spawn interval, ensuring it doesn't go below the minimum
        const proposedInterval = this.baseEnemySpawnInterval - ((this.waveNumber - 1) * this.enemySpawnIntervalReductionPerWave);
        this.enemySpawnInterval = Math.max(this.minEnemySpawnInterval, proposedInterval);
        
        // Increase enemy type chances, capped
        this.chaserSpawnChance = Math.min(0.35, this.baseChaserSpawnChance + ((this.waveNumber -1) * 0.025)); 
        this.shootingEnemySpawnChance = Math.min(0.30, this.baseShootingEnemySpawnChance + ((this.waveNumber-1) * 0.02)); 
        this.kamikazeSpawnChance = Math.min(0.25, this.baseKamikazeSpawnChance + ((this.waveNumber-1) * 0.015)); 

        this.bossSpawnScoreThreshold += this.bossScoreIncrement + (this.waveNumber * 100);
    }

    canSpawnBoss(currentScore) {
        return currentScore >= this.bossSpawnScoreThreshold && !this.bossActiveThisWave;
    }

    markBossSpawnedForWave() {
        this.bossActiveThisWave = true;
    }
}