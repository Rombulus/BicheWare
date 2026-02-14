import { MiniGame } from '../core/MiniGame.js';

export class Tournesol extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Tournesol/balcon.png';

        this.bgWin = new Image();
        this.bgWin.src = 'Images/Tournesol/balcon_fleur.png';

        this.canImg = new Image();
        this.canImg.src = 'Images/Tournesol/arrosoir.png';

        // State
        this.canX = 100;
        this.canY = 300;
        this.isDragging = false;

        // Zone target (Pot position - Assume center bottom or check image visuals later)
        // Adjust these based on visual test
        this.potX = 400;
        this.potY = 400;
        this.potRadius = 100;

        this.waterTime = 0;
        this.requiredTime = 2.0;

        // Bindings
        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    start() {
        super.start();
        console.log("Tournesol Start");

        this.canX = 100;
        this.canY = 300;
        this.waterTime = 0;

        // Events
        this.canvas.addEventListener('mousedown', this.handleDown);
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mouseup', this.handleUp);
    }

    handleDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Check if clicking can (simple rect check)
        if (mx > this.canX && mx < this.canX + 150 && my > this.canY && my < this.canY + 150) {
            this.isDragging = true;
        }
    }

    handleMove(e) {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            this.canX = e.clientX - rect.left - 75; // Center anchor
            this.canY = e.clientY - rect.top - 75;
        }
    }

    handleUp() {
        this.isDragging = false;
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.isWon) return;

        // Check if can is over pot
        // Assuming pot is roughly at 400, 400
        // And water pours from can spout (offset ?)
        // Let's assume spout is at canX + 150 (right side)
        const spoutX = this.canX + 150;
        const spoutY = this.canY + 50;

        // Simple distance check to pot center
        const dx = spoutX - this.potX;
        const dy = spoutY - this.potY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // "Watering" zone (generous)
        if (dist < 150) {
            this.waterTime += dt;
            if (this.waterTime >= this.requiredTime) {
                this.win();
            }
        }
    }

    draw() {
        if (!this.isActive) return;

        // Draw BG
        const currentBg = this.isWon && this.bgWin.complete ? this.bgWin : this.bg;
        if (currentBg.complete) {
            this.ctx.drawImage(currentBg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#8B4513";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Water particles if watering (simple effect)
        const spoutX = this.canX + 150;
        const spoutY = this.canY + 50;
        const dx = spoutX - this.potX;
        const dy = spoutY - this.potY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150 && !this.isWon) {
            this.ctx.strokeStyle = "blue";
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.moveTo(spoutX, spoutY);
            this.ctx.lineTo(spoutX - 20, spoutY + 100);
            this.ctx.lineTo(spoutX + 10, spoutY + 120);
            this.ctx.stroke();
        }

        // Draw Can
        this.ctx.save();
        if (dist < 150) {
            // Tilted
            this.ctx.translate(this.canX + 75, this.canY + 75);
            this.ctx.rotate(Math.PI / 4); // 45 deg
            this.ctx.translate(-(this.canX + 75), -(this.canY + 75));
        }

        if (this.canImg.complete) {
            this.ctx.drawImage(this.canImg, this.canX, this.canY, 150, 150);
        } else {
            this.ctx.fillStyle = "grey";
            this.ctx.fillRect(this.canX, this.canY, 100, 100);
        }
        this.ctx.restore();

        super.draw();
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleDown);
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('mouseup', this.handleUp);
    }
}
