import { MiniGame } from '../core/MiniGame.js';

export class Couverts extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Couverts/tiroir.png';

        // V4: Simple version. Any slot works.
        // User said: "il faut simplement prendre les 3 couverts et les ranger dans le tiroir peu importe l'endroit."
        // Wide target zone = The whole drawer area.

        const drawerZone = { x: 100, y: 50, w: 600, h: 350 };

        this.items = [
            { name: 'fork', img: new Image(), x: 100, y: 450, w: 100, h: 100, placed: false },
            { name: 'knife', img: new Image(), x: 350, y: 450, w: 100, h: 100, placed: false },
            { name: 'spoon', img: new Image(), x: 600, y: 450, w: 100, h: 100, placed: false }
        ];

        this.items[0].img.src = 'Images/Couverts/fourchette.png';
        this.items[1].img.src = 'Images/Couverts/couteau.png';
        this.items[2].img.src = 'Images/Couverts/cuillere.png';

        this.target = drawerZone;
        this.draggedItem = null;
        this.dragOffset = { x: 0, y: 0 };

        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    start() {
        super.start();
        console.log("Couverts Start V4");

        this.items[0].x = 100; this.items[0].y = 450;
        this.items[1].x = 350; this.items[1].y = 450;
        this.items[2].x = 600; this.items[2].y = 450;
        this.items.forEach(i => i.placed = false);

        this.canvas.addEventListener('mousedown', this.handleDown);
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mouseup', this.handleUp);

        this.playSound('Son/SFX/Couverts/couverts.mp3', true);
        this.playSound('Son/SFX/Entrecote/fond.mp3', true); // Re-using restaurant background sound
    }

    handleDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        for (let item of this.items) {
            if (item.placed) continue;
            if (mx > item.x && mx < item.x + item.w &&
                my > item.y && my < item.y + item.h) {
                this.draggedItem = item;
                this.dragOffset.x = mx - item.x;
                this.dragOffset.y = my - item.y;
                break;
            }
        }
    }

    handleMove(e) {
        if (this.draggedItem) {
            const rect = this.canvas.getBoundingClientRect();
            this.draggedItem.x = e.clientX - rect.left - this.dragOffset.x;
            this.draggedItem.y = e.clientY - rect.top - this.dragOffset.y;
        }
    }

    handleUp() {
        if (this.draggedItem) {
            const item = this.draggedItem;
            const cx = item.x + item.w / 2;
            const cy = item.y + item.h / 2;

            // Check drawer zone
            if (cx > this.target.x && cx < this.target.x + this.target.w &&
                cy > this.target.y && cy < this.target.y + this.target.h) {
                item.placed = true;
            }

            this.draggedItem = null;
            this.checkWin();
        }
    }

    checkWin() {
        if (this.items.every(i => i.placed)) {
            this.win();
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
            this.ctx.fillStyle = "#8B4513";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.items.forEach(item => {
            if (item.img.complete) {
                this.ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
            } else {
                this.ctx.fillStyle = "silver";
                this.ctx.fillRect(item.x, item.y, item.w, item.h);
            }
        });

        super.draw();
    }

    getInstruction() {
        return "RANGE TOUT !";
    }
}
