export class GameManager {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentGame = null;
        this.games = {}; // Map of game names to classes
        this.lastTime = performance.now();

        // UI Elements
        this.uiTimer = document.getElementById('timer');
        this.uiInstruction = document.getElementById('instruction');
        this.uiInstructionHeader = document.getElementById('instruction-header');

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
        this.currentGame.onShowInstruction = (text) => this.showInstruction(text);

        // Fetch the first instruction the game might want to show
        let instr = "JOUTE !";
        if (this.currentGame.getInstruction) {
            instr = this.currentGame.getInstruction();
        }

        // Show once, wait for slide, THEN start game
        this.showInstruction(instr);

        setTimeout(() => {
            if (this.currentGame && !this.currentGame.isActive) {
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
        this.hideInstruction(); // Hide any remaining instruction

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
        if (!text) return;
        this.uiInstruction.innerText = text;
        this.uiInstruction.classList.add('visible');
        this.uiInstructionHeader.innerText = ""; // Clear header initially
        this.uiInstructionHeader.style.opacity = "0";

        if (this.instructionTimeout) clearTimeout(this.instructionTimeout);

        this.instructionTimeout = setTimeout(() => {
            // After 0.5s, hide center and show in header
            this.uiInstruction.classList.remove('visible');
            this.uiInstructionHeader.innerText = text;
            this.uiInstructionHeader.style.opacity = "1";
        }, 500);
    }

    hideInstruction() {
        this.uiInstruction.classList.remove('visible');
        this.uiInstructionHeader.innerText = "";
        this.uiInstructionHeader.style.opacity = "0";
        if (this.instructionTimeout) clearTimeout(this.instructionTimeout);
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.currentGame) {
            this.currentGame.update(dt);
            this.currentGame.draw();

            // Update UI (optional text timer, now we have bomb timer in canvas)
            if (this.uiTimer) {
                this.uiTimer.innerText = Math.ceil(this.currentGame.timeLeft);
            }
        } else {
            // Idle screen: don't clear immediateley if we want to see the last result
            // Clear only if no instruction is visible or after a long idle?
            // For now, let's just make sure we don't clear if an instruction like "GAGNÉ" is up
            if (!this.uiInstruction.classList.contains('visible')) {
                this.ctx.fillStyle = '#222';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        requestAnimationFrame(this.loop);
    }
}
