import { GameManager } from './core/GameManager.js';
import { Helicobiche } from './games/Helicobiche.js';
import { GratteFizz } from './games/GratteFizz.js';
import { Tournesol } from './games/Tournesol.js';
import { AiresCerveau } from './games/AiresCerveau.js';
import { CourseBiche } from './games/CourseBiche.js';
import { BearTime } from './games/BearTime.js';
import { Liste } from './games/Liste.js';
import { Piano } from './games/Piano.js';
import { Couverts } from './games/Couverts.js';
import { FindBear } from './games/FindBear.js';
import { Pied } from './games/Pied.js';
import { Entrecote } from './games/Entrecote.js';
import { Routine } from './games/Routine.js';
import { Brotato } from './games/Brotato.js';
import { Capture } from './games/Capture.js';

const gameManager = new GameManager();

// --- Dev Mode Logic ---
const gameSelector = document.getElementById('game-selector');
const startBtn = document.getElementById('start-game-btn');

// List of games to register (Add new games here)
const gamesList = [
    { name: 'Helicobiche', class: Helicobiche },
    { name: 'GratteFizz', class: GratteFizz },
    { name: 'Tournesol', class: Tournesol },
    { name: 'AiresCerveau', class: AiresCerveau },
    { name: 'CourseBiche', class: CourseBiche },
    { name: 'BearTime', class: BearTime },
    { name: 'Liste', class: Liste },
    { name: 'Piano', class: Piano },
    { name: 'Couverts', class: Couverts },
    { name: 'FindBear', class: FindBear },
    { name: 'Pied', class: Pied },
    { name: 'Entrecote', class: Entrecote },
    { name: 'Routine', class: Routine },
    { name: 'Brotato', class: Brotato },
    { name: 'Capture', class: Capture },
];

// Register games
gamesList.forEach(game => {
    gameManager.registerGame(game.name, game.class);

    // Add to dropdown
    const option = document.createElement('option');
    option.value = game.name;
    option.innerText = game.name;
    gameSelector.appendChild(option);
});

startBtn.addEventListener('click', () => {
    const selectedGame = gameSelector.value;
    if (selectedGame) {
        gameManager.startGame(selectedGame);
    } else {
        gameManager.startRandomLoop();
    }
});

// Expose manager for debugging
window.gameManager = gameManager;
