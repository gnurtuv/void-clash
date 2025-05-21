// js/uiManager.js
class UIManager {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.waveDisplayElement = document.getElementById('waveDisplay');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.bossHealthContainerElement = document.getElementById('bossHealthContainer');
        this.bossHealthBarElement = document.getElementById('bossHealthBar');
        this.bossNameElement = document.getElementById('bossName');
    }

    updateScore(score) {
        this.scoreElement.textContent = `Score: ${score}`;
    }

    updateLives(lives) {
        this.livesElement.textContent = `Lives: ${lives}`;
    }

    updateWave(waveNumber) {
        this.waveDisplayElement.textContent = `Wave: ${waveNumber}`;
    }

    showGameOver(score) {
        this.finalScoreElement.textContent = score;
        this.gameOverElement.style.display = 'block';
    }

    hideGameOver() {
        this.gameOverElement.style.display = 'none';
    }

    showBossHealth(show, name = "BOSS") {
        this.bossHealthContainerElement.style.display = show ? 'block' : 'none';
        if (show) {
            this.bossNameElement.textContent = name;
            this.updateBossHealthBar(1); // Full health initially
        }
    }

    updateBossHealthBar(percentage) {
        const percentValue = Math.max(0, Math.min(1, percentage)) * 100;
        this.bossHealthBarElement.style.width = `${percentValue}%`;
    }
}