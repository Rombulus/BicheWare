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
        this.isGameOver = false;
        this.lives = 4;
        this.isTransitioning = false;
        this.currentVoiceOutcome = null;

        // High Score
        this.highScore = this.loadHighScore();
        this.leaderboardEntries = this.loadLeaderboard();
        if (this.leaderboardEntries.length === 0 && this.highScore > 0) {
            this.leaderboardEntries.push({ id: 'previous-record', name: 'Mattéa', score: this.highScore, date: '' });
        }
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
        this.voiceAudio.preload = 'auto';
        this.voiceAudio.setAttribute('playsinline', '');
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
        this.gamesPlayedTotal = 0;
        this.speedMultiplier = 1.0;
        this.speedTier = 0;
        this.isGameOver = false;
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
        this.playVoice(this.winVoiceSrc);

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
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isLooping = false;

        // Save before touching optional end-screen elements: the iPad layout
        // no longer includes #score-display.
        const currentRun = this.saveCompletedRun();

        if (this.uiTransition) {
            this.uiTransition.style.display = 'block';
            this.uiTransition.classList.add('game-over');
        }
        if (this.uiScore) this.uiScore.innerText = this.score;
        this.updateLivesUI();
        this.renderLeaderboard(currentRun);

        // Keep the final score visible long enough to read the leaderboard.
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    }

    loadHighScore() {
        try {
            const storedScores = ['biche_highscore', 'biche-ware-pb']
                .map(key => Number.parseInt(window.localStorage.getItem(key), 10))
                .filter(score => Number.isFinite(score) && score >= 0);
            return storedScores.length ? Math.max(...storedScores) : 0;
        } catch (error) {
            console.warn('Could not read saved high score:', error);
            return 0;
        }
    }

    loadLeaderboard() {
        try {
            const saved = JSON.parse(window.localStorage.getItem('biche_leaderboard') || '[]');
            if (!Array.isArray(saved)) return [];

            return saved
                .filter(entry => entry && Number.isFinite(Number(entry.score)) && Number(entry.score) >= 0)
                .map(entry => ({
                    id: String(entry.id || ''),
                    name: String(entry.name || 'Mattéa').slice(0, 24),
                    score: Math.floor(Number(entry.score)),
                    date: typeof entry.date === 'string' ? entry.date : ''
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        } catch (error) {
            console.warn('Could not read saved leaderboard:', error);
            return [];
        }
    }

    saveCompletedRun() {
        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: 'Mattéa',
            score: Math.max(0, Math.floor(Number(this.score) || 0)),
            date: new Date().toISOString()
        };

        this.leaderboardEntries = [...this.leaderboardEntries, entry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        this.highScore = Math.max(this.highScore, entry.score);

        try {
            window.localStorage.setItem('biche_highscore', String(this.highScore));
            window.localStorage.setItem('biche_leaderboard', JSON.stringify(this.leaderboardEntries));
        } catch (error) {
            console.warn('Could not save game records:', error);
        }

        this.updateHighScoreUI();
        return entry;
    }

    renderLeaderboard(currentRun) {
        if (!this.uiLeaderboard) return;

        const fakeData = [
            { id: 'fake-ours', name: 'Ours', score: 50 },
            { id: 'fake-cerf', name: 'Cerf', score: 30 },
            { id: 'fake-renard', name: 'Renard', score: 20 },
            { id: 'fake-lapin', name: 'Lapin', score: 15 },
            { id: 'fake-mulot', name: 'Mulot', score: 5 }
        ];
        const playerEntries = [...this.leaderboardEntries];
        if (currentRun && !playerEntries.some(entry => entry.id === currentRun.id)) {
            playerEntries.push(currentRun);
        }
        const leaderboard = [...fakeData, ...playerEntries]
            .sort((a, b) => b.score - a.score);

        this.uiLeaderboard.replaceChildren();
        const title = document.createElement('h2');
        title.textContent = 'TOP BICHES';
        this.uiLeaderboard.appendChild(title);

        const finalScore = document.createElement('p');
        finalScore.className = 'leaderboard-current-score';
        finalScore.textContent = `SCORE DE LA PARTIE : ${this.score}`;
        this.uiLeaderboard.appendChild(finalScore);

        leaderboard.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-entry' + (entry.id === currentRun?.id ? ' player-row' : '');

            const rank = document.createElement('span');
            rank.className = 'rank';
            rank.textContent = String(index + 1);

            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = entry.name;

            const score = document.createElement('span');
            score.className = 'score';
            score.textContent = String(entry.score);

            row.append(rank, name, score);
            this.uiLeaderboard.appendChild(row);
        });

        this.uiLeaderboard.classList.remove('hidden');
    }

    playVoice(src) {
        if (!this.voiceAudio) return;

        const audio = this.voiceAudio;
        audio.pause();
        audio.src = src;
        audio.volume = 1.0;
        audio.playbackRate = 1.0;
        try {
            audio.currentTime = 0;
        } catch (error) {
            // A newly assigned source may not be seekable until metadata loads.
        }
        audio.play().catch(error => console.warn(`Audio playback failed for ${src}:`, error));
    }

    playGlobalVoice(isWon) {
        if (this.currentVoiceOutcome !== null) {
            console.log(`GameManager: Voice already triggered for this game (${this.currentVoiceOutcome})`);
            return;
        }
        this.currentVoiceOutcome = isWon;

        // Winning transitions play the biche voice with the same unlocked player.
        if (isWon) return;

        const sounds = ['nice try.mp3', 'oh no.mp3', 'too bad.mp3'];
        const src = `Son/Voix/lost/${sounds[Math.floor(Math.random() * sounds.length)]}`;
        this.playVoice(src);
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
