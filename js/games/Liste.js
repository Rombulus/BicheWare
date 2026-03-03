import { MiniGame } from '../core/MiniGame.js';

/**
 * Liste - Mini-game
 * 
 * Concept: A shopping list appears on a page with 2 handwritten-style items.
 * The player must draw a line to cross off each item before time runs out.
 * Win: Both items crossed off.
 * Lose: Timer runs out before all items are crossed.
 *
 * Detection: Point-by-point. For each point in the drawn stroke, we check if it
 * falls inside the item's hitbox. We count how many DISTINCT horizontal positions
 * covered this zone. If coverage exceeds 35% of the item width, it's crossed.
 */
export class Liste extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);

        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Liste/page.png';

        this.lineImgs = [
            'Images/Liste/ligne1.png',
            'Images/Liste/ligne2.png',
            'Images/Liste/ligne3.png'
        ].map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        // Items and drawing state
        this.items = [];
        this.isDrawing = false;
        this.currentStroke = [];  // points of current stroke being drawn
        this.allStrokes = [];     // all completed strokes (for rendering)

        this.handleDown = this.handleDown.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleUp = this.handleUp.bind(this);
    }

    start() {
        super.start();
        console.log("Liste Start V7 - Rewrite");
        this.timeLeft = 8.0;

        // Reset drawing state
        this.currentStroke = [];
        this.allStrokes = [];

        // Pick 2 distinct random line images
        const indices = [0, 1, 2];
        indices.sort(() => Math.random() - 0.5);
        const chosen = [indices[0], indices[1]];

        // Place items on the page, vertically stacked with good spacing
        // The page.png covers roughly x:120-720, y:60-870 on a 800x600 canvas
        // (but canvas may be different; we'll use percentage-based offsets)
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        // Item dimensions: each ligne img is wide and short
        const itemW = Math.round(cw * 0.55);
        const itemH = 55;
        const startX = Math.round(cw * 0.22);

        // Two fixed vertical positions, well separated
        const yPositions = [
            Math.round(ch * 0.35),
            Math.round(ch * 0.58)
        ];

        this.items = chosen.map((imgIdx, i) => ({
            id: i,
            img: this.lineImgs[imgIdx],
            x: startX,
            y: yPositions[i],
            w: itemW,
            h: itemH,
            crossed: false
        }));

        this.canvas.addEventListener('mousedown', this.handleDown);
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mouseup', this.handleUp);

        // Play ambient sound
        const mus = this.playSound('Son/Musique/transi.mp3', true);
        if (mus) mus.volume = 0.4;

        this.scribeSound = null;
    }

    // ─── Input Handlers ──────────────────────────────────────────────────────

    handleDown(e) {
        if (!this.isActive) return;
        this.isDrawing = true;
        this.currentStroke = [];
        this.addPoint(e);
        if (!this.scribeSound) {
            this.scribeSound = this.playSound('Son/SFX/Liste/scribe.mp3', true);
        }
    }

    handleMove(e) {
        if (!this.isActive || !this.isDrawing) return;
        this.addPoint(e);
    }

    handleUp(e) {
        if (!this.isActive) return;
        this.isDrawing = false;
        if (this.scribeSound) {
            this.scribeSound.pause();
            this.scribeSound = null;
        }

        // Commit the stroke
        if (this.currentStroke.length > 1) {
            this.allStrokes.push([...this.currentStroke]);
        }

        // Check if any item is now crossed by this stroke
        this.checkCrossings(this.currentStroke);
        this.currentStroke = [];

        // Immediately win if all items crossed
        if (this.items.every(item => item.crossed)) {
            this.win();
            this.endGame();
        }
    }

    addPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.currentStroke.push({
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        });
    }

    // ─── Crossing Detection ───────────────────────────────────────────────────

    /**
     * Checks whether the given stroke crosses each uncrossed item.
     * Strategy: count how many unique x-columns (rounded to nearest 5px) of
     * the item's rect are touched by any stroke point that is also in the item's
     * y-range. If the covered width >= 30% of the item width, it's crossed.
     */
    checkCrossings(stroke) {
        if (stroke.length < 2) return;

        for (const item of this.items) {
            if (item.crossed) continue;

            // Generous ±40px vertical hitbox
            const yTop = item.y - 40;
            const yBottom = item.y + item.h + 40;

            const xColumns = new Set();

            for (const pt of stroke) {
                if (pt.y >= yTop && pt.y <= yBottom &&
                    pt.x >= item.x - 10 && pt.x <= item.x + item.w + 10) {
                    // Bucket into 5px columns
                    xColumns.add(Math.round(pt.x / 5) * 5);
                }
            }

            // Each bucket is ~5px wide; require only 20% coverage
            const coveredPx = xColumns.size * 5;
            const coveragePct = coveredPx / item.w;
            console.log(`Liste: item ${item.id} coverage=${Math.round(coveragePct * 100)}% (${coveredPx}px / ${item.w}px)`);
            if (coveragePct >= 0.20) {
                item.crossed = true;
                console.log(`Liste: item ${item.id} CROSSED!`);
            }
        }
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update(dt) {
        if (!this.isActive || this.isWon) return;

        // Manually decrement timer with speed applied (NOT via super to avoid double endGame)
        const scaledDt = dt * this.speedMultiplier;
        this.timeLeft -= scaledDt;
        this.bombTimer.update(scaledDt);

        if (this.timeLeft <= 0) {
            // Do ONE final cross check before ending
            this.checkCrossings(this.currentStroke);

            if (this.items.every(item => item.crossed)) {
                this.win();
            }
            this.endGame(); // called exactly once
        }
    }

    // ─── Draw ─────────────────────────────────────────────────────────────────

    draw() {
        if (!this.isActive) return;

        // Background page
        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw items (list lines)
        for (const item of this.items) {
            if (item.img.complete) {
                this.ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
            }
        }

        // Draw all committed strokes
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(20, 20, 120, 0.85)';
        this.ctx.lineWidth = 12;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (const stroke of this.allStrokes) {
            if (stroke.length < 2) continue;
            this.ctx.beginPath();
            this.ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                this.ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            this.ctx.stroke();
        }

        // Draw current stroke in progress
        if (this.isDrawing && this.currentStroke.length >= 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
            for (let i = 1; i < this.currentStroke.length; i++) {
                this.ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
            }
            this.ctx.stroke();
        }

        this.ctx.restore();

        super.draw();
    }

    // ─── Cleanup ──────────────────────────────────────────────────────────────

    cleanup() {
        super.cleanup();
        this.canvas.removeEventListener('mousedown', this.handleDown);
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('mouseup', this.handleUp);
    }

    getInstruction() {
        return 'BARRE LA LISTE !';
    }
}
