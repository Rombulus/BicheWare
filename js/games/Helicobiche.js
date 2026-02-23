import { MiniGame } from '../core/MiniGame.js';

export class Helicobiche extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.bgDay = new Image();
        this.bgDay.src = 'Images/Voyage_en_helicobiche/hspace_d.png';

        this.bgNight = new Image();
        this.bgNight.src = 'Images/Voyage_en_helicobiche/hspace_n.png';

        this.playerDay = new Image();
        this.playerDay.src = 'Images/Voyage_en_helicobiche/helicobiche rose.png';

        this.playerDisco = new Image();
        this.playerDisco.src = 'Images/Voyage_en_helicobiche/dischelico.png';

        this.isNight = false;
        this.isDisco = false;

        this.playerX = 50;
        this.playerY = 300;
        this.speedX = 0;
        this.speedY = 0;
        this.moveSpeed = 300;
        this.wonTriggered = false;

        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    start() {
        super.start();
        console.log("Helicobiche Start V6");

        this.isNight = Math.random() < 0.5;
        this.wonTriggered = false;

        if (this.isNight) {
            this.isDisco = Math.random() < 0.5;
        } else {
            this.isDisco = false;
        }

        // V6: Lower Start Pos
        this.playerX = 50;
        this.playerY = 520;

        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        this.showInstruction("VOLE !");
        this.helicoSound = this.playSound('Son/SFX/Helicobiche/helico.mp3', true);
    }

    handleKeyDown(e) {
        if (this.keys.hasOwnProperty(e.code)) {
            this.keys[e.code] = true;
        }
    }

    handleKeyUp(e) {
        if (this.keys.hasOwnProperty(e.code)) {
            this.keys[e.code] = false;
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);
        if (this.wonTriggered) return;

        if (this.timeLeft <= 0) {
            this.endGame();
            return;
        }

        this.speedX = 0;
        this.speedY = 0;

        if (this.keys.ArrowUp) this.speedY = -this.moveSpeed;
        if (this.keys.ArrowDown) this.speedY = this.moveSpeed;
        if (this.keys.ArrowLeft) this.speedX = -this.moveSpeed;
        if (this.keys.ArrowRight) this.speedX = this.moveSpeed;

        this.playerX += this.speedX * dt;
        this.playerY += this.speedY * dt;

        this.playerX = Math.max(0, Math.min(this.playerX, this.canvas.width - 50));
        this.playerY = Math.max(0, Math.min(this.playerY, this.canvas.height - 50));

        if (this.playerX > 680 && !this.wonTriggered) {
            this.wonTriggered = true;
            this.speedX = 0;
            this.speedY = 0;
            if (this.helicoSound) {
                this.helicoSound.pause();
                this.helicoSound = null;
            }
            this.playSound('Son/SFX/BearFind/check.mp3');
            // Remove timer snapping to avoid double win triggers or state issues
            this.win();
        }
    }

    draw() {
        if (!this.isActive) return;

        let bg = this.bgDay;
        if (this.isNight && this.bgNight && this.bgNight.complete && this.bgNight.naturalWidth > 0) bg = this.bgNight;

        let player = this.playerDay;
        if (this.isNight) {
            if (this.isDisco && this.playerDisco && this.playerDisco.complete && this.playerDisco.naturalWidth > 0) player = this.playerDisco;
            else {
                // V6: Fallback to Rose if Night asset missing or not disco
                // User didn't provide "helicobiche dark.png"
                if (this.playerDay && this.playerDay.complete) player = this.playerDay;
            }
        }

        try {
            if (bg && bg.complete) {
                this.ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.ctx.fillStyle = this.isNight ? "#000033" : "#87CEEB";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            if (player && player.complete) {
                this.ctx.save();
                this.ctx.translate(this.playerX + 40, this.playerY + 30);
                this.ctx.scale(-1, 1); // Flip horizontally
                this.ctx.drawImage(player, -40, -30, 80, 60);
                this.ctx.restore();
            } else {
                this.ctx.fillStyle = this.isDisco ? "purple" : "pink";
                this.ctx.fillRect(this.playerX, this.playerY, 50, 50);
            }
        } catch (e) {
            console.error("Draw error", e);
        }

        super.draw();

        if (this.isWon) {
            // "Arrivé !" removed per user request
        }
    }

    cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    getInstruction() {
        return "VOLE !";
    }
}
