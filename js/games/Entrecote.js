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
        console.log("Entrecote Start V6");

        this.state = 'waiting';
        this.timer = 0;
        this.waitTime = 1.0 + Math.random() * 2.0;

        // V6: Infinite Time
        this.timeLeft = 9999;

        this.currentItem = null;
        this.itemX = 800;

        this.canvas.addEventListener('mousedown', this.handleClick);
        this.showInstruction("ATTENDS !");
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
                if (this.itemX <= 500) {
                    this.itemX = 500;
                    this.step = 'wait';
                    this.waitTimer = 0.5;
                }
            } else if (this.step === 'wait') {
                this.waitTimer -= dt;
                if (this.waitTimer <= 0) this.step = 'out';
            } else if (this.step === 'out') {
                this.itemX += this.itemSpeed * dt;
                if (this.itemX > 800) {
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
        this.itemX = 800; // Start off-screen

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
                this.ctx.drawImage(img, this.itemX, this.itemY, 300, 300);
            }
        } else if (this.state === 'finished') {
            if (this.isWon) {
                this.ctx.fillStyle = "lime";
                this.ctx.fillText("MIAM !", 350, 300);
            }
        }

        // V6: NO super.draw() call!
        // This prevents the Timer text from appearing.
        // We do have to ensure instruction or other base UI is considered?
        // GameManager draws instruction DOM separately.
        // So we are good.
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleClick);
    }
}
