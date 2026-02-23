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
            {
                id: 0, color: "blue", polygon: [
                    [180, 20], [300, 10], [450, 15], [580, 25], [620, 80], [600, 130],
                    [500, 150], [400, 170], [300, 160], [200, 140], [160, 80]
                ]
            },   // Top (Bloby)
            {
                id: 1, color: "red", polygon: [
                    [300, 200], [450, 210], [530, 300], [500, 420], [400, 450],
                    [280, 430], [220, 350], [250, 250]
                ]
            },  // Center (Bloby)
            {
                id: 2, color: "orange", isMulti: true, areas: [
                    { polygon: [[20, 280], [150, 300], [180, 450], [140, 560], [30, 540]] }, // Left bloby
                    { polygon: [[620, 280], [770, 300], [790, 450], [750, 560], [640, 540]] } // Right bloby
                ]
            },
            {
                id: 3, color: "purple", polygon: [
                    [50, 480], [300, 460], [550, 470], [750, 490], [780, 580],
                    [600, 595], [400, 590], [150, 595], [30, 570]
                ]
            } // Bottom (Bloby)
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
    }

    isPointInPolygon(point, polygon) {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i][0], yi = polygon[i][1];
            let xj = polygon[j][0], yj = polygon[j][1];
            let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
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
            let inZone = false;
            if (z.isMulti) {
                inZone = z.areas.some(a => this.isPointInPolygon([mouseX, mouseY], a.polygon));
            } else {
                inZone = this.isPointInPolygon([mouseX, mouseY], z.polygon);
            }

            if (inZone) {
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

        // Highlight Target Zone
        if (!this.isWon) {
            const z = this.zones[this.targetZoneIndex];
            this.ctx.fillStyle = "rgba(255, 255, 0, 0.3)"; // Yellow highlight for any zone to be clear
            if (z.isMulti) {
                z.areas.forEach(a => {
                    this.ctx.beginPath();
                    this.ctx.moveTo(a.polygon[0][0], a.polygon[0][1]);
                    a.polygon.forEach(p => this.ctx.lineTo(p[0], p[1]));
                    this.ctx.closePath(); // Close the path to fill correctly
                    this.ctx.fill();
                });
            } else {
                this.ctx.beginPath();
                this.ctx.moveTo(z.polygon[0][0], z.polygon[0][1]);
                z.polygon.forEach(p => this.ctx.lineTo(p[0], p[1]));
                this.ctx.closePath(); // Close the path to fill correctly
                this.ctx.fill();
            }
        }

        if (this.isRubbing && !this.isWon) {
            const rect = this.canvas.getBoundingClientRect();
            const lastX = this.lastMouse ? this.lastMouse.x - rect.left : 0;
            const lastY = this.lastMouse ? this.lastMouse.y - rect.top : 0;

            // Visual feedback
            const z = this.zones[this.targetZoneIndex];
            let inZone = false;
            if (z.isMulti) {
                inZone = z.areas.some(a => this.isPointInPolygon([lastX, lastY], a.polygon));
            } else {
                inZone = this.isPointInPolygon([lastX, lastY], z.polygon);
            }

            if (inZone) {
                this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                this.ctx.beginPath();
                this.ctx.arc(lastX, lastY, 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        super.draw();
    }

    getInstruction() {
        return "ENDORS !";
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleDown);
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('mouseup', this.handleUp);
    }
}
