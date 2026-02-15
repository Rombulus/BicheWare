import { MiniGame } from '../core/MiniGame.js';

export class AiresCerveau extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.bg = new Image();
        this.bg.src = 'Images/4_Aires/Mattéa.jpg';

        // V6: 4 Quadrants defined by cross.
        // Assuming cross is centered roughly at 400,300?
        // User image shows cross: Vertical line + Horizontal line.
        // Let's define the center point of the cross.
        const cx = 350;
        const cy = 200;
        // 4 Zones: TL, TR, BL, BR

        this.zones = [
            { id: 0, x: 0, y: 0, w: cx, h: cy }, // TL
            { id: 1, x: cx, y: 0, w: 800 - cx, h: cy }, // TR
            { id: 2, x: 0, y: cy, w: cx, h: 600 - cy }, // BL
            { id: 3, x: cx, y: cy, w: 800 - cx, h: 600 - cy } // BR
        ];

        this.targetZoneIndex = 0;

        this.rubScore = 0;
        this.requiredRub = 400;
        this.lastMouse = null;
        this.isRubbing = false;

        this.handleMove = this.handleMove.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    start() {
        super.start();
        console.log("AiresCerveau Start V6");

        this.rubScore = 0;
        this.isRubbing = false;

        // Pick one target zone
        this.targetZoneIndex = Math.floor(Math.random() * 4);

        this.canvas.addEventListener('mousedown', this.handleDown);
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mouseup', this.handleUp);

        this.showInstruction("GRATTE LA ZONE ROUGE !");
    }

    handleDown(e) {
        this.isRubbing = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    handleUp() {
        this.isRubbing = false;
        this.lastMouse = null;
        if (this.scratchSound) {
            this.scratchSound.pause();
            this.scratchSound = null;
        }
    }

    handleMove(e) {
        if (this.isRubbing && this.lastMouse && !this.isWon) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const z = this.zones[this.targetZoneIndex];

            if (mouseX > z.x && mouseX < z.x + z.w &&
                mouseY > z.y && mouseY < z.y + z.h) {

                if (!this.scratchSound) {
                    this.scratchSound = this.playSound('Son/SFX/AireCerveau/scratch.mp3', true);
                }

                const dx = Math.abs(e.clientX - this.lastMouse.x);
                const dy = Math.abs(e.clientY - this.lastMouse.y);
                const dist = dx + dy;

                this.rubScore += dist * 0.5;
                if (this.rubScore > this.requiredRub) {
                    this.triggerWin();
                }
            } else {
                if (this.scratchSound) {
                    this.scratchSound.pause();
                    this.scratchSound = null;
                }
            }
            this.lastMouse = { x: e.clientX, y: e.clientY };
        }
    }

    triggerWin() {
        if (this.isWon) return;
        this.win();
        if (this.scratchSound) {
            this.scratchSound.pause();
            this.scratchSound = null;
        }
        this.playSound('Son/SFX/AireCerveau/snore.mp3');
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
            this.ctx.fillStyle = "#333";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Cross (Black lines)
        const cx = 350; const cy = 200;
        this.ctx.strokeStyle = "rgba(0,0,0,0.5)";
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, 600);
        this.ctx.moveTo(0, cy); this.ctx.lineTo(800, cy);
        this.ctx.stroke();

        // Highlight Target Zone (Red)
        if (!this.isWon) {
            const z = this.zones[this.targetZoneIndex];
            this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            this.ctx.fillRect(z.x, z.y, z.w, z.h);
        }

        if (this.isRubbing && !this.isWon) {
            const rect = this.canvas.getBoundingClientRect();
            const lastX = this.lastMouse ? this.lastMouse.x - rect.left : 0;
            const lastY = this.lastMouse ? this.lastMouse.y - rect.top : 0;

            // Visual feedback
            const z = this.zones[this.targetZoneIndex];
            if (lastX > z.x && lastX < z.x + z.w &&
                lastY > z.y && lastY < z.y + z.h) {
                this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                this.ctx.beginPath();
                this.ctx.arc(lastX, lastY, 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        super.draw();

        if (this.isWon) {
            this.ctx.fillStyle = "white";
            this.ctx.font = "40px Arial";
            this.ctx.fillText("ZZZZzzzz....", 300, 300);
        }
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleDown);
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('mouseup', this.handleUp);
    }
}
