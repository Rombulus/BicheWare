export class BombTimer {
    constructor() {
        this.container = document.getElementById('bomb-timer-container');
        this.fuseSegmentsContainer = document.getElementById('fuse-segments');
        this.fuseTip = document.getElementById('fuse-tip');
        this.bombVisuals = document.getElementById('bomb-visuals');

        this.segments = [];

        this.duration = 0;
        this.timeRemaining = 0;
        this.speedMultiplier = 1.0;
        this.isRunning = false;

        this.onExplode = null;

        this.hide();
    }

    StartTimer(newDuration) {
        this.duration = newDuration;
        this.timeRemaining = newDuration;
        this.speedMultiplier = 1.0;
        this.isRunning = true;
        this.container.classList.remove('exploded');
        this.container.classList.remove('tension-low');

        const segmentCount = Math.ceil(newDuration) - 1;

        this.fuseSegmentsContainer.innerHTML = '';
        this.segments = [];

        for (let i = 0; i < segmentCount; i++) {
            const seg = document.createElement('div');
            seg.classList.add('fuse-segment');
            this.fuseSegmentsContainer.appendChild(seg);
            this.segments.push(seg);
        }

        this.show();
        this.updateVisuals();
    }

    ResetTimer() {
        this.timeRemaining = this.duration;
        this.container.classList.remove('exploded');
        this.container.classList.remove('tension-low');
        this.segments.forEach(seg => seg.classList.remove('burnt'));
        this.updateVisuals();
    }

    SetSpeed(multiplier) {
        this.speedMultiplier = multiplier;
    }

    StopTimer() {
        this.isRunning = false;
    }

    update(dt) {
        if (!this.isRunning || this.timeRemaining <= 0) return;

        this.timeRemaining -= dt * this.speedMultiplier;

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.triggerExplosion();
        }

        this.updateVisuals();
        this.handleTension();
    }

    updateVisuals() {
        if (this.duration === 0) return;

        const progress = this.timeRemaining / this.duration;
        const totalSegments = this.segments.length; // 4

        // Discrete Snapping Logic
        // We want the tip to SNAP to the end of the currently active segment.
        // We calculate how many full segments are "left".
        // Math.ceil ensure that 3.1 segments becomes 4 segments.
        // 0.1 segments becomes 1 segment.
        // 0 segments is explosion.

        const visibleSegmentsCount = Math.ceil(progress * totalSegments);

        // Update Visibility
        // DOM Order: seg-4 (Index 0), seg-3 (1), seg-2 (2), seg-1 (3)
        // Visual Order (L to R): seg-1, seg-2, seg-3, seg-4.
        // Burning from Right means seg-4 disappears first.

        // If visibleCount = 3, we want seg-1, seg-2, seg-3 visible. Seg-4 burnt.
        // Seg-4 is Index 0.
        // Seg-3 is Index 1.
        // Seg-2 is Index 2.
        // Seg-1 is Index 3.

        // Visible: 3. Burnt: 1.
        // We need to burn Index 0.

        // General Rule:
        // Burnt Count = Total - visibleSegmentsCount.
        // Burn indices 0 to (BurntCount - 1).

        const burntCount = totalSegments - visibleSegmentsCount;

        this.segments.forEach((seg, index) => {
            if (index < burntCount) {
                seg.classList.add('burnt');
            } else {
                seg.classList.remove('burnt');
            }
        });

        // Snap Tip Position
        // Tip should be at the "burning edge" (Left side of the first visible segment).
        // This corresponds to the right side of the last burnt segment.
        // If 0 segments burnt -> Tip at 0%.
        // If 1 segment burnt -> Tip at 1/N * 100%.
        // If all segments burnt -> Tip at 100% (Explosion).

        const snapPercent = (burntCount / totalSegments) * 100;
        this.fuseTip.style.left = `${snapPercent}%`;
    }

    handleTension() {
        const progress = this.timeRemaining / this.duration;
        if (progress < 0.25 && !this.container.classList.contains('tension-low')) {
            this.container.classList.add('tension-low');
        }
    }

    triggerExplosion() {
        this.isRunning = false;
        this.container.classList.add('exploded');

        if (this.onExplode) {
            this.onExplode();
        }

        const event = new CustomEvent('OnBombExploded');
        window.dispatchEvent(event);
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
}
