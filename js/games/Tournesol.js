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

        this.dropImg = new Image();
        this.dropImg.src = 'Images/Tournesol/gouttes.png';

        // State
        this.canX = 100;
        this.canY = 300;
        this.isDragging = false;
        this.isWatering = false;

        this.potX = 400;
        this.potY = 400;
        this.potRadius = 100;

        this.waterTime = 0;
        this.requiredTime = 2.0;

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
        this.isWatering = false;

        this.canvas.addEventListener('pointerdown', this.handleDown);
        window.addEventListener('pointermove', this.handleMove);
        window.addEventListener('pointerup', this.handleUp);
        window.addEventListener('pointercancel', this.handleUp);
    }

    handleDown(e) {
        const { x: mx, y: my } = this.getCanvasPoint(e);

        if (mx > this.canX && mx < this.canX + 150 && my > this.canY && my < this.canY + 150) {
            this.isDragging = true;
            this.capturePointer(e);
        }
    }

    handleMove(e) {
        if (this.isDragging) {
            const { x, y } = this.getCanvasPoint(e);
            this.canX = x - 75;
            this.canY = y - 75;
        }
    }

    handleUp(e) {
        this.isDragging = false;
        if (e) this.releasePointer(e);
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.isWon) return;

        const spoutX = this.canX + 130; // Spout location on the image
        const spoutY = this.canY + 80;

        const dx = spoutX - this.potX;
        const dy = spoutY - this.potY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
            this.isWatering = true;
            if (!this.waterSound) {
                this.waterSound = this.playSound('Son/SFX/Tournesol/water.mp3', true);
            }
            this.waterTime += dt * this.speedMultiplier;
            if (this.waterTime >= this.requiredTime) {
                this.triggerWin();
            }
        } else {
            this.isWatering = false;
            if (this.waterSound) {
                this.waterSound.pause();
                this.waterSound = null;
            }
        }
    }

    triggerWin() {
        if (this.isWon) return;
        this.triggerResultVoice(true);
        this.win();
        if (this.waterSound) {
            this.waterSound.pause();
            this.waterSound = null;
        }
        this.playSound('Son/SFX/Tournesol/pousse.mp3');
    }

    draw() {
        if (!this.isActive) return;

        const currentBg = this.isWon && this.bgWin.complete ? this.bgWin : this.bg;
        if (currentBg.complete) {
            this.ctx.drawImage(currentBg, 0, 0, this.canvas.width, this.canvas.height);
        }

        const spoutX = this.canX + 130;
        const spoutY = this.canY + 80;

        if (this.isWatering && !this.isWon && this.dropImg.complete) {
            this.ctx.save();
            this.ctx.translate(spoutX, spoutY + 40);
            this.ctx.rotate(Math.PI / 4); // Aligner avec l'inclinaison de l'arrosoir
            this.ctx.drawImage(this.dropImg, -50, -50, 100, 100);
            this.ctx.restore();
        }

        this.ctx.save();
        if (this.isWatering && !this.isWon) {
            this.ctx.translate(this.canX + 75, this.canY + 75);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.translate(-(this.canX + 75), -(this.canY + 75));
        }

        if (this.canImg.complete) {
            this.ctx.drawImage(this.canImg, this.canX, this.canY, 150, 150);
        }
        this.ctx.restore();

        super.draw();
    }

    cleanup() {
        this.canvas.removeEventListener('pointerdown', this.handleDown);
        window.removeEventListener('pointermove', this.handleMove);
        window.removeEventListener('pointerup', this.handleUp);
        window.removeEventListener('pointercancel', this.handleUp);
    }

    getInstruction() {
        return "ARROSE !";
    }
}
