export class MiniGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.isActive = false;
        this.timeLeft = 0;
        this.isWon = false;
    }

    /**
     * Called when the game starts.
     * Override this to initialize game state.
     */
    start() {
        this.isActive = true;
        this.isWon = false;
        this.timeLeft = 5.0; // Default 5 seconds per game
        console.log("MiniGame Started");
    }

    /**
     * Called every frame.
     * Override this to update game logic.
     * @param {number} dt Delta time in seconds
     */
    update(dt) {
        if (!this.isActive) return;

        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    /**
     * Called every frame to draw the game.
     * Override this to render game elements.
     */
    draw() {
        if (!this.isActive) return;

        // Default draw
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "30px Arial";
        this.ctx.fillText(`Time: ${this.timeLeft.toFixed(1)}`, 10, 30);
    }

    /**
     * Called when the game ends (time out or win condition met).
     */
    endGame() {
        this.isActive = false;
        console.log(`Game Over. Won: ${this.isWon}`);
        if (this.onGameEnd) {
            this.onGameEnd(this.isWon);
        }
    }

    /**
     * Call this when the player wins the mini-game.
     */
    win() {
        this.isWon = true;
        // Optionally end immediately or wait for time
        // this.endGame(); 
    }

    /**
     * Clean up event listeners etc.
     */
    cleanup() {
        // Override to remove event listeners
    }
}
