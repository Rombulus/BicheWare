import { MiniGame } from './MiniGame.js';

export class GameManager {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.games = {}; // Map of game names to classes
        this.lastTime = 0;

        // UI Elements
        this.uiTimer = document.getElementById('timer');
        this.uiInstruction = document.getElementById('instruction');

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    registerGame(name, gameClass) {
        this.games[name] = gameClass;
    }

    startGame(name) {
        if (this.currentGame) {
            this.currentGame.cleanup();
        }

        const GameClass = this.games[name];
        if (!GameClass) {
            console.error(`Game ${name} not found!`);
            return;
        }

        this.currentGame = new GameClass(this.canvas, this.ctx);
        this.currentGame.onGameEnd = (isWon) => this.handleGameEnd(isWon);

        this.showInstruction("PRÊT ?");

        // Small delay before starting logic to show instruction
        setTimeout(() => {
            this.hideInstruction();
            if (this.currentGame) {
                this.currentGame.start();
            }
        }, 1000);
    }

    handleGameEnd(isWon) {
        console.log(`Mini-game finished. Won: ${isWon}`);
        this.showInstruction(isWon ? "GAGNÉ !" : "PERDU...");

        // In full game, proceed to next game. In dev mode, maybe restart or wait.
    }

    showInstruction(text) {
        this.uiInstruction.innerText = text;
        this.uiInstruction.classList.add('visible');
    }

    hideInstruction() {
        this.uiInstruction.classList.remove('visible');
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.currentGame && this.currentGame.isActive) {
            this.currentGame.update(dt);
            this.currentGame.draw();

            // Update UI
            if (this.uiTimer) {
                this.uiTimer.innerText = Math.ceil(this.currentGame.timeLeft);
            }
        } else {
            // Idle screen or transition
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        requestAnimationFrame(this.loop);
    }
}
