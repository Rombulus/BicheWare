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
        this.isFinished = false;

        // Video Assets
        this.video = document.createElement('video');
        this.video.src = 'Video/confettis.mp4';
        this.video.loop = false;
        this.video.muted = true; // Best practice for auto-play
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

        this.showInstruction("ALTERNE !");
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
        this.playerX = this.finishLine;
        this.win();

        this.playSound('Son/SFX/RunBiche/win.mp3');
        this.video.play().catch(e => console.warn("Video failed:", e));
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
            // Draw confetti if video is playing
            if (!this.video.paused && !this.video.ended) {
                // Implementing chroma key removed green
                this.ctx.save();
                // Create an offscreen buffer or just use globalCompositeOperation? 
                // Better to just draw frame by frame and filter if possible?
                // For simplicity in JS Canvas without shaders: 
                // We'll draw to a temp canvas or use a filter.
                // But simple 2d canvas doesn't have chroma key.
                // Actually, the user wants me to REMOVE the green.
                // I will do it pixel by pixel if performance allows, or use a blend mode.

                // Real Implementation:
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);

                const frame = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const l = frame.data.length / 4;
                for (let i = 0; i < l; i++) {
                    const r = frame.data[i * 4 + 0];
                    const g = frame.data[i * 4 + 1];
                    const b = frame.data[i * 4 + 2];
                    // If green is dominant
                    if (g > 100 && g > r * 1.2 && g > b * 1.2) {
                        frame.data[i * 4 + 3] = 0;
                    }
                }
                this.ctx.putImageData(frame, 0, 0);
                this.ctx.restore();
            }

            this.ctx.fillStyle = "cyan";
            this.ctx.font = "bold 60px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("VICTOIRE !", 400, 100);
            this.ctx.textAlign = "left";
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
        this.video.pause();
        this.video.src = "";
    }
}
