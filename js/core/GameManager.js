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

        // Game Loop State
        this.playedGames = new Set();
        this.isLooping = false;

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    registerGame(name, gameClass) {
        this.games[name] = gameClass;
    }

    /**
     * Start a specific game or the random loop if no name provided.
     */
    startGame(name) {
        if (!name) {
            this.startRandomLoop();
            return;
        }

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

    startRandomLoop() {
        this.isLooping = true;
        this.playedGames.clear();
        this.nextRandomGame();
    }

    nextRandomGame() {
        const available = Object.keys(this.games).filter(name => !this.playedGames.has(name));

        if (available.length === 0) {
            console.log("All games played!");
            this.isLooping = false;
            this.showInstruction("BRAVO ! FIN DE LA BICHE.");
            return;
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        const name = available[randomIndex];
        this.playedGames.add(name);
        this.startGame(name);
    }

    handleGameEnd(isWon) {
        console.log(`Mini-game finished. Won: ${isWon}`);
        this.showInstruction(isWon ? "GAGNÉ !" : "PERDU...");

        // Play global voice sound
        this.playGlobalVoice(isWon);

        // Wait 1 second before next action
        setTimeout(() => {
            if (this.isLooping) {
                this.nextRandomGame();
            }
        }, 1000);
    }

    playGlobalVoice(isWon) {
        const folder = isWon ? 'clear' : 'lost';
        const sounds = isWon
            ? ['Biche.mp3', 'Wow.mp3', 'Yeah.mp3']
            : ['nice try.mp3', 'oh no.mp3', 'too bad.mp3'];

        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        const audio = new Audio(`Son/Voix/${folder}/${randomSound}`);
        audio.play().catch(e => console.warn("Global voice failed:", e));
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

            // Update UI (optional text timer, now we have bomb timer in canvas)
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
