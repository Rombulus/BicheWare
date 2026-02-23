import { MiniGame } from '../core/MiniGame.js';

export class BearTime extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.imgs = [
            'Images/Bear_Time/ours1.png',
            'Images/Bear_Time/ours2.png',
            'Images/Bear_Time/ours3.png'
        ].map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        this.currentImg = null;

        this.handleMove = this.handleMove.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.failed = false;
        this.winTriggered = false;
        this.startMouseX = -1;
        this.startMouseY = -1;
    }

    start() {
        super.start();
        console.log("BearTime Start V4");
        this.failed = false;
        this.winTriggered = false;
        this.startMouseX = -1;

        this.currentImg = this.imgs[Math.floor(Math.random() * this.imgs.length)];

        window.addEventListener('mousedown', this.handleClick);
        this.playSound('Son/SFX/Beartime/soundtrack.mp3', true);
    }

    handleMove(e) {
        if (!this.isActive || this.failed || this.winTriggered) return;

        if (this.startMouseX === -1) {
            this.startMouseX = e.clientX;
            this.startMouseY = e.clientY;
            return;
        }

        const dx = Math.abs(e.clientX - this.startMouseX);
        const dy = Math.abs(e.clientY - this.startMouseY);

        if (dx > 5 || dy > 5) {
            this.fail();
        }
    }

    handleClick() {
        if (!this.isActive || this.failed || this.winTriggered) return;
        this.fail();
    }

    fail() {
        this.failed = true;
        this.stopAllSounds(); // Stop soundtrack on fail
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.timeLeft <= 1.0 && !this.failed && !this.winTriggered) {
            this.winTriggered = true;
            this.stopAllSounds(); // Stop soundtrack on win
            this.playSound('Son/SFX/Beartime/check.wav');
            this.win();
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.currentImg && this.currentImg.complete) {
            this.ctx.drawImage(this.currentImg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "brown";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        super.draw();

        if (this.winTriggered) {
            // V4: Background box for text
            this.ctx.textAlign = "center";
            const text = "JE T'AIME";
            this.ctx.font = "bold 80px Arial";
            const tw = this.ctx.measureText(text).width;

            // Pulsing highlight
            const pulse = 0.8 + Math.sin(Date.now() / 100) * 0.2;
            this.ctx.fillStyle = `rgba(0, 255, 100, ${0.5 * pulse})`;
            this.ctx.fillRect(this.canvas.width / 2 - tw / 2 - 40, this.canvas.height / 2 - 70, tw + 80, 100);

            this.ctx.fillStyle = "#00ff00"; // Green text
            this.ctx.strokeStyle = "#006600";
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.textAlign = "left";
        }
    }

    cleanup() {
        window.removeEventListener('mousedown', this.handleInput);
        window.removeEventListener('keydown', this.handleInput);
    }

    getInstruction() {
        return "NE BOUGE PAS !";
    }
}
