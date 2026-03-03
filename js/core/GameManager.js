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

        // Speed system
        this.speedMultiplier = 1.0;
        this.gamesPlayedTotal = 0;
        this.speedTier = 0; // increments every 7 games
        // Transition UI
        this.uiTransition = document.getElementById('transition-screen');
        this.uiScore = document.getElementById('score-display');
        this.uiLives = document.getElementById('lives-container');
        this.uiSpeedUp = document.getElementById('speed-up-label');

        // Elevator specific
        this.uiElevatorContainer = document.getElementById('elevator-container');
        this.uiElevatorBear = document.getElementById('elevator-bear');
        this.uiLevelDisplay = document.getElementById('level-display');

        // Speed system
        this.speedMultiplier = 1.0;
        this.gamesPlayedTotal = 0;
        this.speedTier = 0; // increments every 7 games

        this.bearFrame = 1;
        this.bearInterval = null;

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
        this.currentGame.speedMultiplier = this.speedMultiplier; // <-- apply speed
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

        // Speed progression: every 7 games
        this.gamesPlayedTotal++;
        let didSpeedUp = false;
        const newTier = Math.floor(this.gamesPlayedTotal / 7);
        if (newTier > this.speedTier) {
            this.speedTier = newTier;
            this.speedMultiplier = Math.min(this.speedMultiplier * 1.2, 1.5);
            didSpeedUp = true;
            console.log(`Speed up! multiplier=${this.speedMultiplier.toFixed(2)}`);
        }

        this.playGlobalVoice(isWon);

        setTimeout(() => {
            if (this.lives <= 0) {
                this.gameOver();
            } else if (this.isLooping) {
                this.showTransition(() => this.nextRandomGame(), didSpeedUp, isWon);
            }
        }, 100);
    }

    showTransition(onComplete, speedUp = false, isWon = true) {
        this.isTransitioning = true;
        this.uiTransition.style.display = 'block';
        this.uiTransition.classList.remove('elevator-zoom'); // Reset zoom
        this.uiScore.innerText = this.score;
        this.updateLivesUI();

        // Level Display
        const currentLevel = this.gamesPlayedTotal + 1;
        this.uiLevelDisplay.innerText = currentLevel;
        this.uiLevelDisplay.classList.remove('center', 'up');

        // SPEED UP
        this.uiSpeedUp.classList.remove('visible');
        if (speedUp) this.uiSpeedUp.classList.add('visible');

        const elevatorBg = document.getElementById('elevator-bg');

        // Sequences d'images
        const closeFrames = [
            'Images/Ascensours/cage/vide.jpg',
            'Images/Ascensours/cage/ouvert 2.jpg',
            'Images/Ascensours/cage/ouvert 1.jpg',
            'Images/Ascensours/cage/full.jpg'
        ];

        const openFrames = [
            'Images/Ascensours/cage/full.jpg',
            'Images/Ascensours/cage/ouvert 1.jpg',
            'Images/Ascensours/cage/ouvert 2.jpg',
            'Images/Ascensours/cage/vide.jpg'
        ];

        // Ensure UI elements are hidden until closed
        this.uiElevatorBear.style.opacity = 0;
        this.uiScore.style.opacity = 0;
        this.uiLives.style.opacity = 0;

        const animateFrames = (frames, interval, callback) => {
            let f = 0;
            const timer = setInterval(() => {
                elevatorBg.style.backgroundImage = `url('${frames[f]}')`;
                f++;
                if (f >= frames.length) {
                    clearInterval(timer);
                    if (callback) callback();
                }
            }, interval);
        };

        const doEnd = () => {
            if (!this.isTransitioning) return;
            this.stopBearAnimation();
            this.uiTransition.style.display = 'none';
            this.uiSpeedUp.classList.remove('visible');
            this.uiLevelDisplay.classList.remove('center', 'up');
            this.isTransitioning = false;

            // Start the next game!
            if (onComplete) onComplete();
        };

        const guardedEnd = () => { doEnd(); };

        // --- Sequence Start ---
        // 1. Fermeture Rapide
        animateFrames(closeFrames, 80, () => {
            // Ascenseur fermé.
            this.uiElevatorBear.style.opacity = 1;
            this.uiScore.style.opacity = 1;
            this.uiLives.style.opacity = 1;
            setTimeout(() => { this.uiLevelDisplay.classList.add('center'); }, 50);

            // 2. Musique et Résultat
            if (isWon) {
                this.uiElevatorBear.src = 'Images/Ascensours/ours/happy.png';
                const audio = new Audio('Son/Musique/transi_win.mp3');
                audio.playbackRate = this.speedMultiplier;
                audio.play().catch(e => console.warn('Transition music failed:', e));

                let nextTriggered = false;
                audio.addEventListener('timeupdate', () => {
                    // Mix transi.mp3 slightly before win finishes
                    if (!nextTriggered && audio.currentTime >= audio.duration - 0.4) {
                        nextTriggered = true;
                        this.startBearIdle();
                        this.playTransiLoop(guardedEnd, openFrames);
                    }
                });
                audio.addEventListener('ended', () => {
                    if (!nextTriggered) {
                        nextTriggered = true;
                        this.startBearIdle();
                        this.playTransiLoop(guardedEnd, openFrames);
                    }
                }, { once: true });
            } else {
                this.uiElevatorBear.src = 'Images/Ascensours/ours/miss.png';
                const loosePitch = Math.max(0.7, this.speedMultiplier * 0.85);
                const audioLoose = new Audio('Son/Musique/loose_transi.mp3');
                audioLoose.playbackRate = loosePitch;
                audioLoose.play().catch(e => console.warn('loose_transi failed:', e));

                audioLoose.addEventListener('ended', () => {
                    this.startBearIdle();
                    this.playTransiLoop(guardedEnd, openFrames);
                }, { once: true });
            }
        });
    }

    playTransiLoop(guardedEnd, openFrames) {
        const audioTransi = new Audio('Son/Musique/transi.mp3');
        audioTransi.playbackRate = this.speedMultiplier;
        audioTransi.play().catch(e => console.warn('transi failed:', e));

        let openTriggered = false;

        // Trigger opening BEFORE the very end of transi
        audioTransi.addEventListener('timeupdate', () => {
            if (!openTriggered && audioTransi.currentTime >= audioTransi.duration - 1.0 / this.speedMultiplier) {
                openTriggered = true;
                this.uiLevelDisplay.classList.add('up');

                // Masquer le score et l'ours pour l'ouverture
                this.uiElevatorBear.style.opacity = 0;
                this.uiScore.style.opacity = 0;
                this.uiLives.style.opacity = 0;
                this.uiSpeedUp.classList.remove('visible');

                // Ouverture Rapide
                const elevatorBg = document.getElementById('elevator-bg');
                let f = 0;
                const timer = setInterval(() => {
                    elevatorBg.style.backgroundImage = `url('${openFrames[f]}')`;
                    f++;
                    if (f >= openFrames.length) {
                        clearInterval(timer);
                        // Start Zoom Effect
                        this.uiTransition.classList.add('elevator-zoom');
                        setTimeout(guardedEnd, 400); // Wait for zoom to finish
                    }
                }, 80);
            }
        });

        audioTransi.addEventListener('ended', () => {
            if (!openTriggered) {
                // Fallback
                guardedEnd();
            }
        }, { once: true });
    }

    startBearIdle() {
        this.stopBearAnimation();
        this.bearFrame = 1;
        this.bearInterval = setInterval(() => {
            this.bearFrame = (this.bearFrame % 3) + 1;
            this.uiElevatorBear.src = `Images/Ascensours/ours/frame ${this.bearFrame}.png`;
        }, 150 / this.speedMultiplier);
    }

    stopBearAnimation() {
        if (this.bearInterval) {
            clearInterval(this.bearInterval);
            this.bearInterval = null;
        }
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
        let src;
        if (isWon) {
            // Always play Biche.mp3 on win
            src = 'Son/Voix/clear/Biche.mp3';
        } else {
            const sounds = ['nice try.mp3', 'oh no.mp3', 'too bad.mp3'];
            src = `Son/Voix/lost/${sounds[Math.floor(Math.random() * sounds.length)]}`;
        }
        const audio = new Audio(src);
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
