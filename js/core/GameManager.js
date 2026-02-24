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
        this.score = 0;
        this.lives = 4;
        this.isTransitioning = false;

        // Transition UI
        this.uiTransition = document.getElementById('transition-screen');
        this.uiScore = document.getElementById('score-display');
        this.uiLives = document.getElementById('lives-container');
        this.uiBiche = document.getElementById('biche-runner');

        this.initLivesUI();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initLivesUI() {
        this.uiLives.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const life = document.createElement('div');
            life.classList.add('life-icon');
            this.uiLives.appendChild(life);
        }
    }

    updateLivesUI() {
        const icons = this.uiLives.querySelectorAll('.life-icon');
        icons.forEach((icon, index) => {
            if (index >= this.lives) {
                icon.classList.add('lost');
            }
        });
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

        // Show instruction only once from GameManager
        this.showInstruction(instr);

        setTimeout(() => {
            if (this.currentGame && !this.currentGame.isActive) {
                this.currentGame.start();
            }
        }, 0);
    }

    startRandomLoop() {
        this.isLooping = true;
        this.score = 0;
        this.lives = 4;
        this.playedGames.clear();
        this.initLivesUI();
        this.uiTransition.classList.remove('game-over');
        this.nextRandomGame();
    }

    nextRandomGame() {
        const available = Object.keys(this.games).filter(name => !this.playedGames.has(name));

        if (available.length === 0) {
            console.log("All games played! Resetting list to keep going...");
            this.playedGames.clear();
            this.nextRandomGame();
            return;
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        const name = available[randomIndex];
        this.playedGames.add(name);
        this.startGame(name);
    }

    handleGameEnd(isWon) {
        console.log(`Mini-game finished. Won: ${isWon}`);
        this.hideInstruction();

        if (isWon) {
            this.score++;
        } else {
            this.lives--;
        }

        this.playGlobalVoice(isWon);

        setTimeout(() => {
            if (this.lives <= 0) {
                this.gameOver();
            } else if (this.isLooping) {
                this.showTransition(() => this.nextRandomGame());
            }
        }, 1000);
    }

    showTransition(onComplete) {
        this.isTransitioning = true;
        this.uiTransition.style.display = 'block';
        this.uiScore.innerText = this.score;
        this.updateLivesUI();

        // Start Biche animation
        this.uiBiche.classList.remove('biche-running');
        void this.uiBiche.offsetWidth; // Trigger reflow
        this.uiBiche.classList.add('biche-running');

        setTimeout(() => {
            this.uiTransition.style.display = 'none';
            this.uiBiche.classList.remove('biche-running');
            this.isTransitioning = false;
            if (onComplete) onComplete();
        }, 2000);
    }

    gameOver() {
        this.isLooping = false;
        this.uiTransition.style.display = 'block';
        this.uiTransition.classList.add('game-over');
        this.uiScore.innerText = this.score;
        this.updateLivesUI();

        // Show restart button or just allow manual reload
        setTimeout(() => {
            window.location.reload();
        }, 5000);
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

        // Reset state
        this.uiInstruction.innerText = text;
        this.uiInstruction.classList.remove('slide-up');
        this.uiInstruction.classList.add('visible');

        // Clear header initially to avoid double display
        this.uiInstructionHeader.style.opacity = "0";
        this.uiInstructionHeader.innerText = "";

        if (this.instructionTimeout) clearTimeout(this.instructionTimeout);

        this.instructionTimeout = setTimeout(() => {
            // Slide up and fade out center
            this.uiInstruction.classList.add('slide-up');
            this.uiInstruction.classList.remove('visible');

            // Sync with header after transition
            setTimeout(() => {
                this.uiInstructionHeader.innerText = text;
                this.uiInstructionHeader.style.opacity = "1";
            }, 300);
        }, 600);
    }

    hideInstruction() {
        this.uiInstruction.classList.remove('visible');
        this.uiInstruction.classList.remove('slide-up');
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
