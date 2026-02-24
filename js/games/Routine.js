import { MiniGame } from '../core/MiniGame.js';

export class Routine extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Routine/visage_biche.png';

        this.pipetteImg = new Image();
        this.pipetteImg.src = 'Images/Routine/pipette.png';

        this.pipetteX = -200;
        this.pipetteY = -200;

        this.zones = [
            { x: 300, y: 200, r: 50, done: false },
            { x: 250, y: 350, r: 50, done: false },
            { x: 350, y: 350, r: 50, done: false }
        ];
        this.targetZone = null;
        this.successCount = 0;

        this.handleMove = this.handleMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    start() {
        super.start();
        console.log("Routine Start V4");

        this.pipetteX = -200;
        this.pipetteY = -200;
        this.successCount = 0;
        this.pickZone();

        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mousedown', this.handleClick);

    }

    pickZone() {
        const available = this.zones.filter(z => !z.done);
        if (available.length > 0) {
            this.targetZone = available[Math.floor(Math.random() * available.length)];
        }
    }

    handleMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.pipetteX = e.clientX - rect.left;
        this.pipetteY = e.clientY - rect.top;
        // Trail suppression: just logic updates position. Draw handles rendering.
        // User complained about remnants. This implies screen clear failure?
        // MiniGame.js had clear removed.
        // So I MUST redraw the full background every frame.
    }

    handleClick() {
        if (!this.isActive || !this.targetZone) return;

        const tipX = this.pipetteX;
        const tipY = this.pipetteY + 100;

        const dx = tipX - this.targetZone.x;
        const dy = tipY - this.targetZone.y;

        this.playSound('Son/SFX/Routine/plop.mp3');

        if (Math.sqrt(dx * dx + dy * dy) < this.targetZone.r + 30) {
            this.targetZone.done = true;
            this.successCount++;
            if (this.successCount >= 3) {
                this.win();
            } else {
                this.pickZone();
            }
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);
    }

    draw() {
        if (!this.isActive) return;

        // V4: Ensure BG covers everything to clear previous frame
        if (this.bg.complete) {
            this.drawImageProp(this.ctx, this.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "pink";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.targetZone && !this.isWon) {
            this.ctx.strokeStyle = "rgba(0,255,255,0.5)";
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(this.targetZone.x, this.targetZone.y, this.targetZone.r, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (this.pipetteImg.complete) {
            this.ctx.drawImage(this.pipetteImg, this.pipetteX - 75, this.pipetteY - 150, 150, 300);
        } else {
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(this.pipetteX - 25, this.pipetteY, 50, 150);
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
        return "APPLIQUE !";
    }
}
