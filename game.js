// --- CONFIGURACIÓN Y CONEXIÓN ---
// IMPORTANTE: Reemplaza con la URL de tu servidor en Render
const SERVER_URL = 'https://snake-game-backend-btux.onrender.com'; 
const socket = io(SERVER_URL);

const mainMenu = document.getElementById('main-menu');
const lobby = document.getElementById('lobby');
const gameContainer = document.getElementById('game-container');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const startBtn = document.getElementById('start-btn');
const roomInput = document.getElementById('roomInput');
const roomCodeDisplay = document.getElementById('room-code');
const playerList = document.getElementById('player-list');
const scoreList = document.getElementById('scoreList');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
canvas.width = 600;
canvas.height = 600;

let players = {};
let apple = {};
let myId = null;
let currentRoomId = null;

// --- MANEJO DE MENÚS Y LOBBY ---
createBtn.addEventListener('click', () => {
  socket.emit('createRoom');
});

joinBtn.addEventListener('click', () => {
  const roomId = roomInput.value;
  if (roomId) {
    socket.emit('joinRoom', roomId);
  }
});

startBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('startGame', currentRoomId);
    }
});

socket.on('roomCreated', (data) => {
  myId = socket.id;
  currentRoomId = data.roomId;
  players = data.players;
  showLobby(data.roomId, data.hostId);
});

socket.on('updatePlayers', (data) => {
  myId = socket.id;
  players = data.players;
  showLobby(currentRoomId, data.hostId);
});

socket.on('gameStarted', (roomState) => {
    players = roomState.players;
    apple = roomState.apple;
    lobby.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    draw();
});

socket.on('gameStateUpdate', (gameState) => {
    players = gameState.players;
    apple = gameState.apple;
    draw();
});

socket.on('playerEliminated', ({ playerId, remainingPlayers }) => {
    // Opcional: mostrar un mensaje de que alguien fue eliminado
    players = remainingPlayers;
});


socket.on('error', (message) => {
  alert(message);
});

function showLobby(roomId, hostId) {
  mainMenu.classList.add('hidden');
  lobby.classList.remove('hidden');
  roomCodeDisplay.innerText = roomId;
  
  if (socket.id === hostId) {
      startBtn.classList.remove('hidden');
  }

  playerList.innerHTML = '';
  for (const id in players) {
    const li = document.createElement('li');
    li.style.color = players[id].color;
    li.textContent = `Jugador ${id === hostId ? '(Host)' : ''}`;
    playerList.appendChild(li);
  }
}

// --- LÓGICA DE DIBUJO ---
function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const player = players[id];
    ctx.fillStyle = player.color;
    player.body.forEach(segment => {
      ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
      ctx.strokeStyle = 'black';
      ctx.strokeRect(segment.x, segment.y, gridSize, gridSize);
    });
  }

  ctx.fillStyle = 'red';
  ctx.font = `${gridSize * 1.5}px Arial`;
  ctx.fillText('🍎', apple.x, apple.y + gridSize * 0.8);

  updateScoreboard();
}

function updateScoreboard() {
    scoreList.innerHTML = '';
    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
    sortedPlayers.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `Jugador: ${player.score}`;
        li.style.color = player.color;
        scoreList.appendChild(li);
    });
}

// --- CONTROLES ---
window.addEventListener('keydown', e => {
    let direction;
    switch (e.key) {
        case 'ArrowUp': direction = 'up'; break;
        case 'ArrowDown': direction = 'down'; break;
        case 'ArrowLeft': direction = 'left'; break;
        case 'ArrowRight': direction = 'right'; break;
        default: return;
    }
    e.preventDefault();
    socket.emit('directionChange', { roomId: currentRoomId, direction });
});