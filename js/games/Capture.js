import { MiniGame } from '../core/MiniGame.js';

export class Capture extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Capture/pré.png';

        this.ufoImg = new Image();
        this.ufoImg.src = 'Images/Capture/soucoupe.png';

        this.cowImg = new Image();
        this.cowImg.src = 'Images/Capture/vache_ufo.png';

        this.cowX = -200;
        this.cowY = 400;
        this.cowSpeed = 800; // Slower? User said WAY too fast.

        // V2: Zone based capture
        this.captureZone = { x: 300, y: 400, w: 200, h: 100 }; // Under UFO

        this.captured = false;
        this.hasLaunched = false;

        this.handleInput = this.handleInput.bind(this);
    }

    start() {
        super.start();
        console.log("Capture Start V2");

        this.cowX = -200;
        this.captured = false;
        this.hasLaunched = false;

        setTimeout(() => {
            this.hasLaunched = true;
        }, 1000 + Math.random() * 2000);

        window.addEventListener('mousedown', this.handleInput);
        window.addEventListener('keydown', this.handleInput);

        this.showInstruction("CAPTURE !");
    }

    handleInput() {
        if (!this.isActive || this.captured) return;

        // Check if cow is within zone
        // Simple 1D check since Y is constant?
        // Zone X: 300 to 500. Cow must be inside.

        if (this.cowX > 250 && this.cowX < 550) { // Lenient zone
            this.captured = true;
            this.win();
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.hasLaunched && !this.captured) {
            this.cowX += this.cowSpeed * dt;
        }

        if (this.captured) {
            this.cowY -= 500 * dt;
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "green";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // UFO V2: Bigger (200x100)
        if (this.ufoImg.complete) {
            this.ctx.drawImage(this.ufoImg, 300, 50, 200, 100);
        } else {
            this.ctx.fillStyle = "gray";
            this.ctx.fillRect(300, 50, 200, 100);
        }

        // Beam
        this.ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        this.ctx.fillRect(320, 120, 160, 400); // Visual zone hint

        // Cow
        if (this.cowImg.complete) {
            this.ctx.drawImage(this.cowImg, this.cowX, this.cowY, 150, 120); // Bigger cow?
        } else {
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(this.cowX, this.cowY, 100, 80);
        }

        super.draw();
    }

    cleanup() {
        window.removeEventListener('mousedown', this.handleInput);
        window.removeEventListener('keydown', this.handleInput);
    }
}
