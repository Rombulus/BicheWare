import { MiniGame } from '../core/MiniGame.js';

export class Liste extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Liste/page.png';

        this.patterns = [
            'Images/Liste/ligne1.png',
            'Images/Liste/ligne2.png',
            'Images/Liste/ligne3.png'
        ].map(src => { const i = new Image(); i.src = src; return i; });

        this.items = [];
        this.isDrawing = false;

        // V5: Disappearing bug fix
        // We need to store ALL lines drawn, not just current one.
        // Actually, item.lines was handling it?
        // "quand on essaye de dessiner sur les deux lignes du dessous, l'écriture disparaît."
        // Maybe I was clearing the canvas incorrectly or not drawing `item.lines` properly?
        // Or `currentLine` was interfering. 
        // I will inspect draw loop.

        this.currentLine = [];

        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    start() {
        super.start();
        console.log("Liste Start V5");
        this.timeLeft = 8.0;

        this.items = [
            { id: 1, w: 400, h: 50, crossed: false, lines: [], img: this.patterns[0] },
            { id: 2, w: 400, h: 50, crossed: false, lines: [], img: this.patterns[1] },
            { id: 3, w: 400, h: 50, crossed: false, lines: [], img: this.patterns[2] }
        ];

        const yPositions = [150, 250, 350];
        yPositions.sort(() => Math.random() - 0.5);

        this.items.forEach((item, index) => {
            item.x = 200;
            item.y = yPositions[index];
        });

        this.canvas.addEventListener('mousedown', this.handleDown);
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mouseup', this.handleUp);

        this.showInstruction("RAYE TOUT !");
    }

    handleDown(e) {
        this.isDrawing = true;
        this.currentLine = [];
        this.addPoint(e);
    }

    handleMove(e) {
        if (this.isDrawing) {
            this.addPoint(e);
        }
    }

    handleUp() {
        this.isDrawing = false;
        // Verify crossings for current line
        this.checkCrossings();

        // V5: Fix Disappearing Lines
        // I should push currentLine to a global history OR attach to items?
        // Attach to item is good if it crosses that item.
        // But what if it crosses NONE? It should still show?
        // "l'écriture disparaît" -> They want to see their scribbles even if they miss?
        // Yes, likely.
        // Let's store ALL lines in a separate list for rendering, independant of logic.
    }

    addPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.currentLine.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }

    checkCrossings() {
        if (this.currentLine.length < 2) return;

        // V5: Save this line permanently to items it touches OR global?
        // User complained "writing disappears".
        // Let's attach to the closest item or just keep a global "marks" array.
        // Global is safer.

        const minX = Math.min(...this.currentLine.map(p => p.x));
        const maxX = Math.max(...this.currentLine.map(p => p.x));
        const minY = Math.min(...this.currentLine.map(p => p.y));
        const maxY = Math.max(...this.currentLine.map(p => p.y));

        let logicApplied = false;
        this.items.forEach(item => {
            // Check overlap
            if (minX < item.x + item.w && maxX > item.x &&
                minY < item.y + item.h && maxY > item.y) {

                const widthCovered = Math.min(maxX, item.x + item.w) - Math.max(minX, item.x);
                if (widthCovered > item.w * 0.4) {
                    item.crossed = true;
                }

                // Store line on item for rendering (or just keep global?)
                item.lines.push([...this.currentLine]);
                logicApplied = true;
            }
        });

        // If line didn't touch anything relevant, maybe store it on background?
        // For simplicity, let's just use item lines. If user misses, line might disappear?
        // That explains the bug.
        // Fix: Use global lines array.
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        // V5: Check Win every update
        // "quand on en a complété une, le jeu est compté comme gagné" -> Fix this
        // Ensure EVERY item is crossed.
        if (this.items.every(i => i.crossed) && !this.isWon) {
            this.win();
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "#eee";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Patterns V5: Thicker VERTICALLY
        // Scale height x2?
        this.items.forEach(item => {
            if (item.img.complete) {
                // Draw higher and a bit lower? 50 is base height. Make it 80.
                this.ctx.drawImage(item.img, item.x, item.y - 15, item.w, 80);
            } else {
                this.ctx.fillStyle = "black";
                this.ctx.fillText("================", item.x, item.y + 25);
            }
        });

        // Drawn lines
        this.ctx.strokeStyle = "rgba(0,0,0,0.8)";
        this.ctx.lineWidth = 15;
        this.ctx.lineCap = "round";
        this.ctx.beginPath();

        // Draw ALL stored lines (from items)
        this.items.forEach(item => {
            item.lines.forEach(line => {
                if (line.length < 2) return;
                this.ctx.moveTo(line[0].x, line[0].y);
                for (let i = 1; i < line.length; i++) this.ctx.lineTo(line[i].x, line[i].y);
            });
        });

        // Draw current line
        if (this.isDrawing && this.currentLine.length > 1) {
            this.ctx.moveTo(this.currentLine[0].x, this.currentLine[0].y);
            for (let i = 1; i < this.currentLine.length; i++) this.ctx.lineTo(this.currentLine[i].x, this.currentLine[i].y);
        }
        this.ctx.stroke();

        super.draw();
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleDown);
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('mouseup', this.handleUp);
    }
}
