import { MiniGame } from '../core/MiniGame.js';

export class Brotato extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Brotato/brotato_map.png';

        this.playerImg = new Image();
        this.playerImg.src = 'Images/Brotato/brotato_patate.png';

        this.enemyImg = new Image();
        this.enemyImg.src = 'Images/Brotato/brotato_alien.png';

        this.player = { x: 400, y: 300, r: 150 };
        this.enemies = [];

        this.handleMove = this.handleMove.bind(this);
    }

    start() {
        super.start();
        console.log("Brotato Start V5");

        this.player = { x: 400, y: 300, r: 150 };
        this.enemies = [];

        for (let i = 0; i < 4; i++) {
            const ex = 200 + Math.random() * 400;
            const ey = 100 + Math.random() * 400;

            this.enemies.push({
                x: ex,
                y: ey,
                r: 100,
                alive: true
            });
        }

        window.addEventListener('mousemove', this.handleMove);
        this.showInstruction("FONCE DEDANS !");
        this.playSound('Son/SFX/Brotato/ost.mp3', true);
    }

    handleMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.player.x = e.clientX - rect.left;
        this.player.y = e.clientY - rect.top;
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.isWon) return;

        let aliveCount = 0;
        this.enemies.forEach(enem => {
            if (!enem.alive) return;
            aliveCount++;

            const dx = this.player.x - enem.x;
            const dy = this.player.y - enem.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.r + enem.r - 40) {
                enem.alive = false;
                this.playSound('Son/SFX/Brotato/die.mp3');
                aliveCount--;
            }
        });

        if (aliveCount === 0) {
            this.win();
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#333";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Enemies
        this.enemies.forEach(enem => {
            if (!enem.alive) return;
            if (this.enemyImg.complete) {
                this.ctx.drawImage(this.enemyImg, enem.x - enem.r, enem.y - enem.r, enem.r * 2, enem.r * 2);
            } else {
                this.ctx.fillStyle = "red";
                this.ctx.beginPath();
                this.ctx.arc(enem.x, enem.y, enem.r, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Player
        if (this.playerImg.complete) {
            this.ctx.drawImage(this.playerImg, this.player.x - this.player.r, this.player.y - this.player.r, this.player.r * 2, this.player.r * 2);
        } else {
            this.ctx.fillStyle = "yellow";
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        super.draw();
    }

    cleanup() {
        window.removeEventListener('mousemove', this.handleMove);
    }
}
