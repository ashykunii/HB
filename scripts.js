const gridContainer = document.getElementById('grid-container');
const scoreDisplay = document.getElementById('score');
const totalGiftsDisplay = document.getElementById('total-gifts');
const winScreen = document.getElementById('win-screen');
const btnReplay = document.getElementById('btn-replay');

const complimentPopup = document.getElementById('compliment-popup');
const complimentText = document.getElementById('compliment-text');
const complimentPhoto = document.getElementById('compliment-photo');
const btnContinue = document.getElementById('btn-continue');

// Game State
let score = 0;
const totalLetters = 10;
let gameOver = false;
let isPaused = false;

// Player Position
let playerPos = { r: 1, c: 1 };

// Compliments Array with optional photos (replace with your own Pinterest/photos!)
const compliments = [
    { text: "Field Trip Day 1!!!", img: "assets/inside01.png" },
    { text: "Finding Dory!", img: "assets/outside01.png" },
    { text: "Aquarium Pic!!!", img: "assets/inside02.png" },
    { text: "Grad Pic with you!", img: "assets/outside02.png" },
    { text: "You and our principal.", img: "assets/inside03.png" },
    { text: "Us under the boiling sun!!!", img: "assets/outside03.png" },
    { text: "Two kheang", img: "assets/inside04.png" },
    { text: "Miss sitting with you!", img: "assets/outside04.png" },
    { text: "You before temple, lol.", img: "assets/inside05.png" },
    { text: "Room 249", img: "/assets/outside05.png" }
];

function shuffleArray(array) {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

let activeCompliments = [];

let map = [];
const COLS = 15;
const ROWS = 15;

function generateRandomMap() {
    let newMap = Array(ROWS).fill().map(() => Array(COLS).fill(1)); // Start with all walls
    
    // Maze Generation (Randomized DFS)
    // Only use odd coordinates for paths to ensure walls in between
    let stack = [{r: 1, c: 1}];
    newMap[1][1] = 0;
    
    const dirs = [
        [-2, 0], [2, 0], [0, -2], [0, 2]
    ];
    
    function shuffleDirs() {
        return shuffleArray([...dirs]);
    }

    while (stack.length > 0) {
        let current = stack[stack.length - 1];
        let moved = false;
        
        let randomDirs = shuffleDirs();
        for (let dir of randomDirs) {
            let nextR = current.r + dir[0];
            let nextC = current.c + dir[1];
            
            // Check bounds (leave outer border as wall)
            if (nextR > 0 && nextR < ROWS - 1 && nextC > 0 && nextC < COLS - 1) {
                if (newMap[nextR][nextC] === 1) {
                    // It's a wall, we can carve a path
                    newMap[nextR][nextC] = 0;
                    newMap[current.r + dir[0]/2][current.c + dir[1]/2] = 0; // Carve wall between
                    stack.push({r: nextR, c: nextC});
                    moved = true;
                    break;
                }
            }
        }
        
        if (!moved) {
            stack.pop();
        }
    }

    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (newMap[r][c] === 1) {
                // 15% chance to knock down a wall to create loops
                if (Math.random() < 0.15) {
                    newMap[r][c] = 0;
                } else {
                    // Assign wall types (Tree, Flower, Bee)
                    const type = Math.random();
                    if (type < 0.33) newMap[r][c] = 1; // Tree
                    else if (type < 0.66) newMap[r][c] = 4; // Flower
                    else newMap[r][c] = 5; // Bee
                }
            }
        }
    }
    
    return newMap;
}

function initGame() {
    // Reset state
    score = 0;
    gameOver = false;
    isPaused = false;
    playerPos = { r: 1, c: 1 };
    scoreDisplay.innerText = score;
    totalGiftsDisplay.innerText = totalLetters;
    winScreen.classList.add('hidden');
    complimentPopup.classList.add('hidden');
    
    activeCompliments = shuffleArray(compliments);
    
    // Generate new random garden
    map = generateRandomMap();
    
    // Find all valid empty paths to place items
    let emptyCells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r][c] === 0 && !(r === 1 && c === 1)) {
                emptyCells.push({r, c});
            }
        }
    }
    
    emptyCells = shuffleArray(emptyCells);
    
    // Place 10 letters
    for(let i=0; i<totalLetters; i++) {
        const cell = emptyCells.pop();
        map[cell.r][cell.c] = 2;
    }
    
    // Place 1 envelope
    const envCell = emptyCells.pop();
    map[envCell.r][envCell.c] = 3;
    
    gridContainer.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
    
    renderGrid();
}

function renderGrid() {
    gridContainer.innerHTML = '';
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (r === playerPos.r && c === playerPos.c) {
                cell.classList.add('player');
                cell.innerText = '🐢'; 
            } else if (map[r][c] === 1) {
                cell.classList.add('wall');
                cell.innerText = '🌳'; 
            } else if (map[r][c] === 4) {
                cell.classList.add('wall');
                cell.innerText = '🪻'; 
            } else if (map[r][c] === 5) {
                cell.classList.add('wall');
                cell.innerText = '🌻';  
            } else if (map[r][c] === 0) {
                cell.classList.add('path');
            } else if (map[r][c] === 2) {
                cell.classList.add('path');
                const gift = document.createElement('div');
                gift.classList.add('gift');
                gift.innerText = '💌';
                cell.appendChild(gift);
            } else if (map[r][c] === 3) {
                cell.classList.add('path');
                if (score >= totalLetters) {
                    const env = document.createElement('div');
                    env.classList.add('envelope');
                    env.innerText = '✉️';
                    cell.appendChild(env);
                }
            }
            
            gridContainer.appendChild(cell);
        }
    }
}

function movePlayer(dr, dc) {
    if (gameOver || isPaused) return;
    
    const newR = playerPos.r + dr;
    const newC = playerPos.c + dc;
    
    if (newR < 0 || newR >= ROWS || newC < 0 || newC >= COLS) return;
    
    const targetCell = map[newR][newC];
    
    // 1, 4, 5 are obstacles
    if (targetCell === 1 || targetCell === 4 || targetCell === 5) return; 
    
    playerPos.r = newR;
    playerPos.c = newC;
    
    if (targetCell === 2) {
        score++;
        scoreDisplay.innerText = score;
        map[newR][newC] = 0; 
        showCompliment();
    }
    
    renderGrid();
    
    if (targetCell === 3 && score >= totalLetters) {
        triggerWin();
    }
}

function showCompliment() {
    isPaused = true;
    const item = activeCompliments.pop() || { text: "You are wonderful!", img: null };
    
    complimentText.innerText = item.text;
    
    if (item.img) {
        complimentPhoto.src = item.img;
        complimentPhoto.classList.remove('hidden');
    } else {
        complimentPhoto.classList.add('hidden');
    }
    
    complimentPopup.classList.remove('hidden');
}

btnContinue.addEventListener('click', () => {
    complimentPopup.classList.add('hidden');
    isPaused = false;
});

function triggerWin() {
    gameOver = true;
    setTimeout(() => {
        winScreen.classList.remove('hidden');
        fireConfetti();
    }, 500);
}

function fireConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#a2d2ff', '#bde0fe', '#8ecae6', '#ffffff'] 
        }));
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#a2d2ff', '#bde0fe', '#8ecae6', '#ffffff']
        }));
    }, 250);
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    if (isPaused && e.key === 'Enter') {
        btnContinue.click();
        return;
    }
    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': movePlayer(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer(0, 1); break;
    }
});

// Touch/Click Controls
document.getElementById('btn-up').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('btn-down').addEventListener('click', () => movePlayer(1, 0));
document.getElementById('btn-left').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('btn-right').addEventListener('click', () => movePlayer(0, 1));

btnReplay.addEventListener('click', initGame);

initGame();
