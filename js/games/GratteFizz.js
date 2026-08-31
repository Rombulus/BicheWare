import { MiniGame } from '../core/MiniGame.js';

export class GratteFizz extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.fizzImg = new Image();
        this.fizzImg.src = 'Images/Gratte_chien/fizz.jpeg';

        this.winImg = new Image();
        this.winImg.src = 'Images/Gratte_chien/h_fizz.png';

        this.starImg = new Image();
        this.starImg.src = 'Images/Gratte_chien/fizz_s.png';

        this.rubScore = 0;
        this.requiredRub = 1200; // V4: Increased significantly
        this.lastMouse = null;
        this.isRubbing = false;

        this.handleMove = this.handleMove.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    start() {
        super.start();
        console.log("GratteFizz Start V4");

        this.rubScore = 0;
        this.isRubbing = false;
        this.lastMouse = null;
        this.pantPlayed = false;

        this.canvas.addEventListener('pointerdown', this.handleDown);
        window.addEventListener('pointermove', this.handleMove);
        window.addEventListener('pointerup', this.handleUp);
        window.addEventListener('pointercancel', this.handleUp);

        // Placeholder for music
    }

    handleDown(e) {
        this.capturePointer(e);
        this.isRubbing = true;
        this.lastMouse = this.getCanvasPoint(e);
        if (!this.isWon && !this.scratchSound) {
            this.scratchSound = this.playSound('Son/SFX/GratteChien/gratte.mp3', true);
        }
    }

    handleUp(e) {
        this.isRubbing = false;
        this.lastMouse = null;
        if (this.scratchSound) {
            this.scratchSound.pause();
            this.scratchSound = null;
        }
        if (e) this.releasePointer(e);
    }

    handleMove(e) {
        if (this.isRubbing && this.lastMouse && !this.isWon) {
            const point = this.getCanvasPoint(e);
            const dx = Math.abs(point.x - this.lastMouse.x);
            const dy = Math.abs(point.y - this.lastMouse.y);
            const dist = dx + dy;

            if (dist > 2) { // Minimal movement to count as scratching
                this.rubScore += dist * 0.5 * this.speedMultiplier;
                this.lastMouse = point;

                if (!this.pantPlayed && this.rubScore > this.requiredRub * 0.8) {
                    this.pantPlayed = true;
                    if (this.isActive) this.playSound('Son/SFX/GratteChien/pant.mp3');
                }

                if (this.rubScore > this.requiredRub) {
                    this.triggerWin();
                }
            }
        }
    }

    triggerWin() {
        if (this.isWon) return;
        this.triggerResultVoice(true);
        this.win();

        if (this.scratchSound) {
            this.scratchSound.pause();
            this.scratchSound = null;
        }

        this.playSound('Son/SFX/GratteChien/success - Sound Effect (1).mp3');
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);
    }

    draw() {
        if (!this.isActive) return;

        const img = this.isWon ? this.winImg : this.fizzImg;

        if (img.complete) {
            this.drawImageProp(this.ctx, img, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#cc5';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.isWon && this.starImg.complete) {
            this.ctx.drawImage(this.starImg, 300, 50, 100, 100);
            this.ctx.drawImage(this.starImg, 500, 50, 100, 100);
            this.ctx.drawImage(this.starImg, 400, 0, 100, 100);
        } else {
            if (this.isRubbing && !this.isWon) {
                this.ctx.fillStyle = "pink";
                this.ctx.font = "30px Arial";
                const mx = this.lastMouse ? this.lastMouse.x : 0;
                const my = this.lastMouse ? this.lastMouse.y : 0;
                this.ctx.fillText("♥", mx, my);
            }
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

    getInstruction() {
        return "GRATTE !";
    }

    cleanup() {
        super.cleanup();
        this.canvas.removeEventListener('pointerdown', this.handleDown);
        window.removeEventListener('pointermove', this.handleMove);
        window.removeEventListener('pointerup', this.handleUp);
        window.removeEventListener('pointercancel', this.handleUp);
    }
}
