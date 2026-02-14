import { MiniGame } from '../core/MiniGame.js';

export class Pied extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Pied/pied.png';

        this.target = { x: 350, y: 150, r: 80 };

        this.clicks = 0;
        this.requiredClicks = 10;

        this.handleClick = this.handleClick.bind(this);
    }

    start() {
        super.start();
        console.log("Pied Start V3");
        this.clicks = 0;
        this.canvas.addEventListener('mousedown', this.handleClick);
        this.showInstruction("MASSE !");
    }

    handleClick(e) {
        if (!this.isActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const dx = mx - this.target.x;
        const dy = my - this.target.y;

        if (Math.sqrt(dx * dx + dy * dy) < this.target.r) {
            this.clicks++;
            if (this.clicks >= this.requiredClicks) {
                this.win();
            }
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#FFCCAA";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (!this.isWon) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${1 - this.clicks / this.requiredClicks})`;
            this.ctx.beginPath();
            this.ctx.arc(this.target.x, this.target.y, this.target.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        super.draw();
        // V3: Removed text
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleClick);
    }
}
