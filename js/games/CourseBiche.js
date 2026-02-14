import { MiniGame } from '../core/MiniGame.js';

export class CourseBiche extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Course/piste.png';

        this.playerImg = new Image();
        this.playerImg.src = 'Images/Course/running_biche.png';

        this.playerX = 50;
        this.playerY = 300;
        this.lastInput = null;

        this.finishLine = 680;

        // V6: Interaction Counter
        this.interactions = 0;
        this.requiredInteractions = 12;

        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.prompt = "GAUCHE";
        this.isFinished = false;
    }

    start() {
        super.start();
        console.log("CourseBiche Start V6");

        this.playerX = 50;
        this.lastInput = null;
        this.prompt = "GAUCHE";
        this.isFinished = false;
        this.interactions = 0;

        window.addEventListener('keydown', this.handleKeyDown);

        this.showInstruction("ALTERNE !");
    }

    handleKeyDown(e) {
        if (!this.isActive || this.isFinished) return;

        let moved = false;
        if (e.code === 'ArrowLeft') {
            if (this.lastInput !== 'left') {
                this.lastInput = 'left';
                this.prompt = "DROITE";
                moved = true;
            }
        } else if (e.code === 'ArrowRight') {
            if (this.lastInput !== 'right') {
                this.lastInput = 'right';
                this.prompt = "GAUCHE";
                moved = true;
            }
        }

        if (moved) {
            this.interactions++;
            this.advance();
            if (this.interactions >= this.requiredInteractions) {
                this.isFinished = true;
                this.playerX = this.finishLine; // Snap to end
                this.win();
            }
        }
    }

    advance() {
        if (this.isFinished) return;

        // Calculate step based on interactions needed to reach finish line from start
        // Dist = 680 - 50 = 630. Steps = 12. Step = 52.5
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
        } else {
            this.ctx.fillStyle = "green";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.playerImg.complete) {
            this.ctx.drawImage(this.playerImg, this.playerX, this.playerY, 150, 150);
        } else {
            this.ctx.fillStyle = "orange";
            this.ctx.fillRect(this.playerX, this.playerY, 50, 50);
        }

        if (!this.isFinished) {
            this.ctx.fillStyle = "white";
            this.ctx.strokeStyle = "black";
            this.ctx.lineWidth = 4;
            this.ctx.font = "bold 60px Arial";
            this.ctx.textAlign = "center";
            this.ctx.strokeText(this.prompt, 400, 100);
            this.ctx.fillText(this.prompt, 400, 100);
            this.ctx.textAlign = "left";
        } else {
            this.ctx.fillStyle = "cyan";
            this.ctx.font = "bold 60px Arial";
            this.ctx.fillText("VICTOIRE !", 280, 100);
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
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
