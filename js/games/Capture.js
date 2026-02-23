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

        this.rayImg = new Image();
        this.rayImg.src = 'Images/Capture/ray.png';

        this.cowX = -200;
        this.cowY = 400;
        this.cowSpeed = 800;

        this.captureZone = { x: 300, y: 400, w: 200, h: 100 };

        this.captured = false;
        this.hasLaunched = false;

        this.handleInput = this.handleInput.bind(this);
    }

    start() {
        super.start();
        console.log("Capture Start V2");

        this.cowX = -200;
        this.cowY = 400;
        this.captured = false;
        this.hasLaunched = false;

        setTimeout(() => {
            this.hasLaunched = true;
        }, 1000 + Math.random() * 2000);

        window.addEventListener('mousedown', this.handleInput);
        window.addEventListener('keydown', this.handleInput);

        this.showInstruction("CAPTURE !");
        this.playSound('Son/SFX/UFO/ufo.mp3', true);
    }

    handleInput() {
        if (!this.isActive || this.captured) return;

        if (this.cowX > 250 && this.cowX < 550) {
            this.captured = true;
            // Removed stopAllSounds() to keep UFO hum
            this.playSound('Son/SFX/UFO/ray.mp3');
            // Don't call this.win() yet, let the animation finish
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.hasLaunched && !this.captured) {
            this.cowX += this.cowSpeed * dt;
            if (this.cowX > this.canvas.width + 200) {
                this.endGame();
            }
        }

        if (this.captured) {
            // Cow stops moving horizontally exactly centered under beam (approx 325-150/2)
            // The beam is at 400. Cow width is 150. Centered at 400 means cowX = 325.
            this.cowX = 325;
            if (this.cowY > 40) {
                this.cowY -= 300 * dt;
            }
            this.cowRotation = (this.cowRotation || 0) + 15 * dt;
            this.cowScale = Math.max(0, (this.cowScale === undefined ? 1 : this.cowScale) - 0.7 * dt);

            if (this.cowScale <= 0.1) {
                this.win(); // Win at the end of animation
            }
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Beam
        if (this.rayImg.complete) {
            this.ctx.save();
            this.ctx.translate(400, 320);
            this.ctx.scale(-1.5, 1.2); // Enlarge and flip horizontal
            this.ctx.drawImage(this.rayImg, -80, -200, 160, 400);
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
            this.ctx.fillRect(320, 120, 160, 400);
        }

        // UFO
        if (this.ufoImg.complete) {
            this.ctx.drawImage(this.ufoImg, 300, 50, 200, 100);
        }

        // Cow
        if (this.cowImg.complete) {
            this.ctx.save();
            const cx = this.cowX + 75;
            const cy = this.cowY + 60;
            this.ctx.translate(cx, cy);
            if (this.captured) {
                this.ctx.rotate(this.cowRotation);
                this.ctx.scale(this.cowScale, this.cowScale);
            }
            this.ctx.drawImage(this.cowImg, -75, -60, 150, 120);
            this.ctx.restore();
        }

        super.draw();
    }

    cleanup() {
        window.removeEventListener('mousedown', this.handleInput);
        window.removeEventListener('keydown', this.handleInput);
    }

    getInstruction() {
        return "CAPTURE !";
    }
}
