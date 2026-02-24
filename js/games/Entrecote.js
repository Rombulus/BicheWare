import { MiniGame } from '../core/MiniGame.js';

export class Entrecote extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        this.bg = new Image();
        this.bg.src = 'Images/Entrecote/entrecote.png';

        this.waiterImg = new Image();
        this.waiterImg.src = 'Images/Entrecote/serveur.png';

        this.distractors = [
            'Images/Entrecote/bandit.png',
            'Images/Entrecote/vache_ent.png'
        ];
        this.distractorImgs = this.distractors.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        this.state = 'waiting';
        this.timer = 0;
        this.currentItem = null;

        this.itemX = 800;
        this.itemY = 150;
        this.itemSpeed = 800;

        this.handleClick = this.handleClick.bind(this);
    }

    start() {
        super.start();
        console.log("Entrecote Start V7 - Final");

        const timerContainer = document.getElementById('bomb-timer-container');
        if (timerContainer) timerContainer.style.display = 'none';

        this.state = 'waiting';
        this.timer = 0;
        this.waitTime = 1.0 + Math.random() * 2.0;

        this.timeLeft = 9999;

        // Dynamic positioning
        this.startX = this.canvas.width;
        this.targetX = this.canvas.width - 150; // V5: Shifted left (was 126)


        this.currentItem = null;
        this.itemX = this.startX;

        this.canvas.addEventListener('mousedown', this.handleClick);
        this.playSound('Son/SFX/Entrecote/fond.mp3', true);
    }

    cleanup() {
        super.cleanup();
        const timerContainer = document.getElementById('bomb-timer-container');
        if (timerContainer) timerContainer.style.display = 'flex';
        this.canvas.removeEventListener('mousedown', this.handleClick);
    }


    handleClick(e) {
        if (!this.isActive || this.state !== 'showing') return;

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (mx > this.itemX && mx < this.itemX + 300 && my > this.itemY && my < this.itemY + 300) {
            if (this.currentItem.type === 'waiter') {
                this.win(); // V6: Only way to win
                this.state = 'finished';
            } else {
                this.state = 'finished'; // Missed (but time keeps running? or Fail?)
                // User said: "La condition de victoire se fait par le fait de cliquer sur le bon trigger."
                // So clicking wrong = nothing? or fail?
                // Let's assume clicking bandit = fail.
                this.endGame();
            }
        }
    }

    update(dt) {
        if (!this.isActive) return;
        // V6: Do NOT call super.update(dt) to avoid time decrement? 
        // Or call it but reset time.
        // super.update handles win checking logic if we use flags.
        // It decrements timeLeft.
        // Safest: call it, then override timeLeft.

        super.update(dt);
        this.timeLeft = 9999; // Force infinite

        if (this.state === 'waiting') {
            this.timer += dt;
            if (this.timer >= this.waitTime) {
                this.spawn();
            }
        } else if (this.state === 'showing') {
            if (this.step === 'in') {
                this.itemX -= this.itemSpeed * dt;
                if (this.itemX <= this.targetX) {
                    this.itemX = this.targetX;
                    this.step = 'wait';
                    this.waitTimer = 0.5;
                }
            } else if (this.step === 'wait') {
                this.waitTimer -= dt;
                if (this.waitTimer <= 0) this.step = 'out';
            } else if (this.step === 'out') {
                this.itemX += this.itemSpeed * dt;
                if (this.itemX > this.startX) {
                    // Missed the pass. Reset to wait?
                    // User implies we wait for the right trigger.
                    // So we go back to waiting loop.
                    this.state = 'waiting';
                    this.timer = 0;
                    this.waitTime = 1.0 + Math.random() * 2.0;
                }
            }
        }
    }

    spawn() {
        this.state = 'showing';
        this.step = 'in';
        this.itemX = this.startX; // Start off-screen

        const r = Math.random();
        if (r < 0.5) {
            const dist = this.distractorImgs[Math.floor(Math.random() * this.distractorImgs.length)];
            this.currentItem = { type: 'distractor', img: dist };
        } else {
            this.currentItem = { type: 'waiter', img: this.waiterImg };
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#330000";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.state === 'showing' && this.currentItem) {
            const img = this.currentItem.img;
            if (img.complete) {
                this.ctx.save();
                this.ctx.translate(this.itemX + 150, this.itemY + 150);
                // No scale(-1, 1) - user image looks Left already.
                this.ctx.rotate(-45 * Math.PI / 180); // Rotate -45 degrees
                this.ctx.drawImage(img, -150, -150, 300, 300);
                this.ctx.restore();
            }
        } else if (this.state === 'finished') {
            // "MIAM !" removed per user request
        }

        // V6: super.draw() called again to show the timer!
        super.draw();
    }

    getInstruction() {
        return "APPELLE LE SERVEUR";
    }
}
