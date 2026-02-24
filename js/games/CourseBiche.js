import { MiniGame } from '../core/MiniGame.js';

export class CourseBiche extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Course/piste.png';

        this.playerImg = new Image();
        this.playerImg.src = 'Images/Course/running_biche.png';

        this.arrowLeft = new Image();
        this.arrowLeft.src = 'Images/Course/gauche.png';

        this.arrowRight = new Image();
        this.arrowRight.src = 'Images/Course/droite.png';

        this.playerX = 50;
        this.playerY = 300;
        this.lastInput = null;

        this.finishLine = 680;

        // V6: Interaction Counter
        this.interactions = 0;
        this.requiredInteractions = 10;

        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.prompt = "left"; // Arrow type
        this.targetSteps = 20 + Math.floor(Math.random() * 10);
        this.wonTriggered = false;
    }

    start() {
        super.start();
        console.log("CourseBiche Start V6");

        this.playerX = 50;
        this.lastInput = null;
        this.prompt = "left";
        this.isFinished = false;
        this.interactions = 0;

        window.addEventListener('keydown', this.handleKeyDown);

        this.playSound('Son/SFX/RunBiche/crowd.mp3', true);
    }

    handleKeyDown(e) {
        if (!this.isActive || this.isFinished) return;

        let moved = false;
        if (e.code === 'ArrowLeft') {
            if (this.lastInput !== 'left') {
                this.lastInput = 'left';
                this.prompt = "right";
                moved = true;
            }
        } else if (e.code === 'ArrowRight') {
            if (this.lastInput !== 'right') {
                this.lastInput = 'right';
                this.prompt = "left";
                moved = true;
            }
        }

        if (moved) {
            this.interactions++;
            this.advance();
            if (this.interactions >= this.requiredInteractions) {
                this.triggerWin();
            }
        }
    }

    triggerWin() {
        if (this.isFinished) return;
        this.isFinished = true;
        this.win();

        this.playSound('Son/SFX/RunBiche/win.mp3');
        // Video removed per user request
    }

    advance() {
        if (this.isFinished) return;
        this.playerX += 52;
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.drawImageProp(this.ctx, this.bg, 0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.playerImg.complete) {
            this.ctx.drawImage(this.playerImg, this.playerX, this.playerY, 150, 150);
        }

        if (!this.isFinished) {
            const arrow = this.prompt === 'left' ? this.arrowLeft : this.arrowRight;
            if (arrow.complete) {
                const size = 100;
                // Center-ish but slightly spread out according to request
                const xOffset = this.prompt === 'left' ? -120 : 120;
                this.ctx.drawImage(arrow, 400 + xOffset - size / 2, 50, size, size);
            }
        } else {
            // Video removed per user request
        }

        super.draw();
    }

    drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
        if (arguments.length === 2) {
            x = y = 0;
            w = ctx.canvas.width;
            h = ctx.canvas.height;
        }
        offsetX = typeof offsetX === "number" ? offsetX : 0.5;
        offsetY = typeof offsetY === "number" ? offsetY : 0.5;
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;
        var iw = img.width, ih = img.height, r = Math.min(w / iw, h / ih), nw = iw * r, nh = ih * r, cx, cy, cw, ch, ar = 1;
        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
        nw *= ar; nh *= ar; cw = iw / (nw / w); ch = ih / (nh / h);
        cx = (iw - cw) * offsetX; cy = (ih - ch) * offsetY;
        if (cx < 0) cx = 0; if (cy < 0) cy = 0; if (cw > iw) cw = iw; if (ch > ih) ch = ih;
        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    }

    cleanup() {
        super.cleanup();
        window.removeEventListener('keydown', this.handleKeyDown);
        // Video removed per user request
    }

    getInstruction() {
        return "ALTERNE !";
    }
}
