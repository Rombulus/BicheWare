import { MiniGame } from '../core/MiniGame.js';

export class FindBear extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bearImg = new Image();
        this.bearImg.src = 'Images/Find_Bear/ours_emo.png';

        this.distractors = [
            'Images/Find_Bear/biche_emo.png',
            'Images/Find_Bear/ele_emo.png',
            'Images/Find_Bear/fizz_emo.png'
        ];
        this.distractorImgs = this.distractors.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        this.objects = [];
        this.handleClick = this.handleClick.bind(this);
    }

    start() {
        super.start();
        console.log("FindBear Start V2");

        this.objects = [];
        // V2: Reduce num distractors, increase size
        const numDistractors = 10;
        const objSize = 100; // was 50

        // Spawn distractors
        for (let i = 0; i < numDistractors; i++) {
            this.objects.push({
                x: Math.random() * (this.canvas.width - objSize),
                y: Math.random() * (this.canvas.height - objSize),
                w: objSize,
                h: objSize,
                img: this.distractorImgs[Math.floor(Math.random() * this.distractorImgs.length)],
                isTarget: false
            });
        }

        // Spawn Target
        this.objects.push({
            x: Math.random() * (this.canvas.width - objSize),
            y: Math.random() * (this.canvas.height - objSize),
            w: objSize,
            h: objSize,
            img: this.bearImg,
            isTarget: true
        });

        // Shuffle checks order 
        this.objects.sort(() => Math.random() - 0.5);

        this.canvas.addEventListener('mousedown', this.handleClick);
        this.showInstruction("TROUVE L'OURS !");
    }

    handleClick(e) {
        if (!this.isActive) return;

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (mx > obj.x && mx < obj.x + obj.w && my > obj.y && my < obj.y + obj.h) {
                if (obj.isTarget) {
                    this.win();
                } else {
                    this.endGame();
                }
                return;
            }
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);
    }

    draw() {
        if (!this.isActive) return;

        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.objects.forEach(obj => {
            if (obj.img.complete) {
                this.ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
            } else {
                this.ctx.fillStyle = obj.isTarget ? "red" : "gray";
                this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
            }
        });

        super.draw();

        if (this.isWon) {
            this.ctx.fillStyle = "white";
            this.ctx.font = "40px Arial";
            this.ctx.fillText("TROUVÉ !", 300, 300);
        }
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleClick);
    }
}
