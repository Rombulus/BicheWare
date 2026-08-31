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

        // Transition UI
        this.uiTransition = document.getElementById('transition-screen');
        this.uiScore = document.getElementById('score-display');
        this.uiLives = document.getElementById('lives-container');
        this.uiSpeedUp = document.getElementById('speed-up-label');
        this.uiBiche = document.getElementById('biche-runner');
        this.uiLevelDisplay = document.getElementById('level-display');
        this.uiHomeScreen = document.getElementById('home-screen');
        this.uiLeaderboard = document.getElementById('leaderboard');
        this.uiScreenFrame = document.getElementById('screen-frame');
        
        // New HUD elements
        this.uiCurrentScore = document.getElementById('current-score');
        this.uiHudLives = document.getElementById('hud-lives');
        this.uiFixedInstruction = document.getElementById('fixed-instruction-box');
        this.uiHighScoreValue = document.getElementById('high-score-value');
        this.uiTouchControls = document.getElementById('touch-controls');
        this.uiFlightControls = document.getElementById('flight-controls');
        this.uiRunningControls = document.getElementById('running-controls');

        // Game Loop State
        this.playedGames = new Set();
        this.isLooping = false;
        this.score = 0;
        this.lives = 4;
        this.isTransitioning = false;
        this.currentVoiceOutcome = null;

        // High Score
        this.highScore = parseInt(localStorage.getItem('biche_highscore')) || 0;
        this.updateHighScoreUI();

        // Speed system
        this.speedMultiplier = 1.0;
        this.gamesPlayedTotal = 0;
        this.speedTier = 0;

        this.preloadImages();
        this.preloadVoices();
        this.initLivesUI();
        this.initTouchControls();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    preloadVoices() {
        this.voiceAudio = new Audio();
        this.voiceAudio.volume = 1.0; // Max volume for voices
        // Preload standard win voice
        this.winVoiceSrc = 'Son/Voix/clear/Biche.mp3';
        this.lossVoicePool = [
            'Son/Voix/lost/nice try.mp3',
            'Son/Voix/lost/oh no.mp3',
            'Son/Voix/lost/too bad.mp3'
        ];
        // Note: Filename fix if needed (too_bad vs too bad)
        // I saw 'too bad.mp3' in list_dir, but common web practice is no spaces. 
        // I'll check the list_dir again for EXACT naming.
    }

    preloadImages() {
        const imagesToPreload = [
            'Images/Course/running_biche.png'
        ];

        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    initLivesUI() {
        if (!this.uiHudLives) return;
        this.uiHudLives.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const life = document.createElement('div');
            life.classList.add('hud-life');
            this.uiHudLives.appendChild(life);
        }
    }

    updateLivesUI() {
        // Updated: Lives are only on transition screen lives-container
        if (!this.uiLives) return;
        this.uiLives.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const life = document.createElement('div');
            life.classList.add('life-icon');
            if (i >= this.lives) life.classList.add('lost');
            this.uiLives.appendChild(life);
        }
    }

    registerGame(name, gameClass) {
        this.games[name] = gameClass;
    }

    /**
     * Start a specific game or the random loop if no name provided.
     */
    startGame(name, prepareOnly = false) {
        if (!name) {
            this.startRandomLoop();
            return;
        }

        this.resetFixedInstruction();
        this.currentVoiceOutcome = null; // Reset for new game

        if (this.currentGame) {
            this.currentGame.cleanup();
        }

        const GameClass = this.games[name];
        if (!GameClass) {
            console.error(`Game ${name} not found!`);
            return;
        }

        this.currentGame = new GameClass(this.canvas, this.ctx);
        this.updateTouchControls(name);
        this.currentGame.speedMultiplier = this.speedMultiplier; // <-- apply speed
        this.currentGame.onGameEnd = (isWon) => this.handleGameEnd(isWon);
        this.currentGame.onShowInstruction = (text) => this.showInstruction(text);
        this.currentGame.onResultVoice = (isWon) => this.playGlobalVoice(isWon); // Ensure reliable voice triggers

        // Force a render of the first frame for the transition screen
        this.currentGame.isActive = true;
        this.currentGame.draw();
        this.currentGame.isActive = false;

        if (!prepareOnly) {
            this.startCurrentGame();
        }
    }

    startCurrentGame() {
        if (!this.currentGame) return;

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
        this.unlockAudio();
        this.hideHomeScreen();
        this.isLooping = true;
        this.score = 0;
        this.lives = 4;
        this.playedGames.clear();
        this.initLivesUI();
        this.uiTransition.classList.remove('game-over');
        this.nextRandomGame();
    }

    unlockAudio() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            if (!window.gameAudioContext) {
                window.gameAudioContext = new AudioContextClass();
            }
            window.gameAudioContext.resume().catch(() => {});
        }

        if (!this.voiceAudio) return;

        // Prime the reusable element from the iPad user's Start tap so later
        // result voices can play during the game loop and transitions.
        this.voiceAudio.src = this.winVoiceSrc;
        this.voiceAudio.muted = true;
        const playPromise = this.voiceAudio.play();
        if (playPromise && playPromise.then) {
            playPromise.then(() => {
                this.voiceAudio.pause();
                this.voiceAudio.currentTime = 0;
                this.voiceAudio.muted = false;
            }).catch(() => {
                this.voiceAudio.muted = false;
            });
        }
    }

    initTouchControls() {
        if (!this.uiTouchControls) return;

        this.uiTouchControls.querySelectorAll('[data-control]').forEach(button => {
            const control = button.dataset.control;
            const release = (event) => {
                event.preventDefault();
                this.setVirtualControl(control, false);
                button.classList.remove('pressed');
            };
            button.addEventListener('pointerdown', (event) => {
                event.preventDefault();
                this.setVirtualControl(control, true);
                button.classList.add('pressed');
            });
            button.addEventListener('pointerup', release);
            button.addEventListener('pointercancel', release);
            button.addEventListener('pointerleave', release);
        });
    }

    setVirtualControl(control, isPressed) {
        if (this.currentGame && this.currentGame.setVirtualControl) {
            this.currentGame.setVirtualControl(control, isPressed);
        }
    }

    updateTouchControls(gameName) {
        if (!this.uiTouchControls) return;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
        const showFlight = isTouchDevice && gameName === 'Helicobiche';
        const showRunning = isTouchDevice && gameName === 'CourseBiche';
        this.uiTouchControls.classList.toggle('visible', showFlight || showRunning);
        this.uiFlightControls.classList.toggle('visible', showFlight);
        this.uiRunningControls.classList.toggle('visible', showRunning);
    }

    nextRandomGame(prepareOnly = false) {
        const available = Object.keys(this.games).filter(name => !this.playedGames.has(name));

        if (available.length === 0) {
            console.log("All games played! Resetting list to keep going...");
            this.playedGames.clear();
            this.nextRandomGame(prepareOnly);
            return;
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        const name = available[randomIndex];
        this.playedGames.add(name);
        this.startGame(name, prepareOnly);
    }

    handleGameEnd(isWon) {
        console.log(`Mini-game finished. Won: ${isWon}`);
        this.hideInstruction();

        if (isWon) {
            // Success!
        } else {
            this.lives--;
            // Shake the screen on loss
            if (this.uiScreenFrame) {
                this.uiScreenFrame.classList.add('shake');
                setTimeout(() => this.uiScreenFrame.classList.remove('shake'), 400);
            }
        }

        // Score = Total games played
        this.gamesPlayedTotal++;
        this.score = this.gamesPlayedTotal;
        this.updateLivesUI();

        // Speed progression: every 15 games
        let didSpeedUp = false;
        const newTier = Math.floor(this.gamesPlayedTotal / 15);
        if (newTier > this.speedTier) {
            this.speedTier = newTier;
            this.speedMultiplier = Math.min(this.speedMultiplier * 1.05, 1.5);
            didSpeedUp = true;
            console.log(`Speed up! multiplier=${this.speedMultiplier.toFixed(2)}`);
        }

        setTimeout(() => {
            if (this.lives <= 0) {
                this.gameOver();
            } else if (this.isLooping) {
                // Fallback: If no voice played yet, play it at transition start
                if (this.currentVoiceOutcome === null) {
                    this.playGlobalVoice(isWon);
                }

                this.showTransition(
                    () => this.nextRandomGame(true),
                    () => this.startCurrentGame(),
                    didSpeedUp,
                    isWon
                );
            }
        }, 100);
    }

    showTransition(onPrepare, onStart, speedUp = false, isWon = true) {
        this.isTransitioning = true;
        this.uiTransition.style.display = 'block';
        this.uiTransition.classList.add('speeding');

        this.updateLivesUI();

        // Prepare next game canvas early
        if (onPrepare) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            onPrepare();
        }

        // Show score (total games)
        this.uiLevelDisplay.innerText = this.score;
        this.uiLevelDisplay.classList.add('center');

        // Show Speed Up if applicable right away
        if (speedUp) this.uiSpeedUp.classList.add('visible');

        // Start Biche animation right away
        void this.uiBiche.offsetWidth; // Trigger reflow
        this.uiBiche.classList.add('biche-running');

        // Play the "BICHE !" sound at full volume
        const bicheAudio = new Audio('Son/Voix/clear/Biche.mp3');
        bicheAudio.volume = 1.0;
        bicheAudio.play().catch(e => console.warn('Biche audio failed:', e));

        // Shorter transition duration
        const transiDuration = 1200;

        setTimeout(() => {
            if (!this.isTransitioning) return;
            this.uiTransition.style.display = 'none';
            this.uiTransition.classList.remove('speeding');
            this.uiBiche.classList.remove('biche-running');
            this.uiSpeedUp.classList.remove('visible');
            this.uiLevelDisplay.classList.remove('center');
            this.isTransitioning = false;
            if (onStart) onStart();
        }, transiDuration);
    }

    gameOver() {
        this.isLooping = false;
        this.uiTransition.style.display = 'block';
        this.uiTransition.classList.add('game-over');
        this.uiScore.innerText = this.score;
        this.updateLivesUI();

        // Show leaderboard
        const fakeData = [
            { name: "Ours", score: 50 },
            { name: "Cerf", score: 30 },
            { name: "Renard", score: 20 },
            { name: "Lapin", score: 15 },
            { name: "Mulot", score: 5 }
        ];

        // Insert Mattéa
        const playerName = "Mattéa";
        const leaderboard = [...fakeData, { name: playerName, score: this.score, isPlayer: true }];
        leaderboard.sort((a, b) => b.score - a.score);

        // Render leaderboard
        this.uiLeaderboard.innerHTML = '<h2>TOP BICHES</h2>';
        this.uiLeaderboard.classList.remove('hidden');

        leaderboard.slice(0, 6).forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-entry' + (entry.isPlayer ? ' player-row' : '');
            row.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            `;
            this.uiLeaderboard.appendChild(row);
        });

        // Save high score if record broken
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('biche_highscore', this.highScore);
            this.updateHighScoreUI();
        }

        // Increase delay before reload to let player see results
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    }

    playGlobalVoice(isWon) {
        if (this.currentVoiceOutcome !== null) {
            console.log(`GameManager: Voice already triggered for this game (${this.currentVoiceOutcome})`);
            return;
        }
        this.currentVoiceOutcome = isWon;

        // Skip manual win voice (Biche) as it plays in transition
        if (isWon) return;

        const sounds = ['nice try.mp3', 'oh no.mp3', 'too bad.mp3'];
        const src = `Son/Voix/lost/${sounds[Math.floor(Math.random() * sounds.length)]}`;

        console.log(`GameManager: Playing result voice: ${src}`);

        try {
            if (this.voiceAudio) {
                this.voiceAudio.pause();
                this.voiceAudio.src = src;
                this.voiceAudio.volume = 1.0;
                this.voiceAudio.playbackRate = 1.0; // Keep voice pitch normal
                this.voiceAudio.play().then(() => {
                    console.log(`GameManager: Voice playing successfully: ${src}`);
                }).catch(e => {
                    console.warn(`GameManager: Voice playback failed for ${src}:`, e);
                });
            } else {
                // Fallback if preload failed for some reason
                const audio = new Audio(src);
                audio.volume = 0.7;
                audio.playbackRate = 1.0; // Keep voice pitch normal
                audio.play().catch(console.warn);
            }
        } catch (err) {
            console.error("GameManager: Error in playGlobalVoice:", err);
        }
    }

    showInstruction(text) {
        if (!text) return;

        // Reset state
        this.uiInstruction.innerText = text;
        this.uiInstruction.classList.remove('slide-up');
        this.uiInstruction.classList.add('visible');

        // Clear header initially to avoid double display
        // (Removed old header logic)

        if (this.instructionTimeout) clearTimeout(this.instructionTimeout);

        this.instructionTimeout = setTimeout(() => {
            // Slide up and fade out center
            this.uiInstruction.classList.add('slide-up');
            this.uiInstruction.classList.remove('visible');

            // Sync with fixed box
            if (this.uiFixedInstruction) {
                this.uiFixedInstruction.innerText = text;
                this.uiFixedInstruction.classList.add('active');
            }
        }, 600);
    }

    resetFixedInstruction() {
        if (this.uiFixedInstruction) {
            this.uiFixedInstruction.innerText = "PRÊT ?";
            this.uiFixedInstruction.classList.remove('active');
        }
    }

    hideInstruction() {
        this.uiInstruction.classList.remove('visible');
        this.uiInstruction.classList.remove('slide-up');
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
            // Idle screen
            if (!this.uiInstruction.classList.contains('visible') && (!this.uiHomeScreen || this.uiHomeScreen.style.display !== 'none')) {
                this.ctx.fillStyle = '#222';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        requestAnimationFrame(this.loop);
    }

    showHomeScreen() {
        if (this.uiHomeScreen) {
            this.uiHomeScreen.style.display = 'flex';
            this.uiHomeScreen.classList.remove('hidden');
        }
    }

    hideHomeScreen() {
        if (this.uiHomeScreen) {
            this.uiHomeScreen.classList.add('hidden');
            setTimeout(() => {
                this.uiHomeScreen.style.display = 'none';
            }, 500);
        }
    }

    updateHighScoreUI() {
        if (this.uiHighScoreValue) {
            this.uiHighScoreValue.innerText = this.highScore;
        }
    }
}
