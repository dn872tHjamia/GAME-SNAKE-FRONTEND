// --- CONFIGURACIÓN Y CONEXIÓN ---
const SERVER_URL = 'https://snake-game-backend-btux.onrender.com'; // Usa tu URL de Render
const socket = io(SERVER_URL);

// Elementos del DOM
const mainMenu = document.getElementById('main-menu');
const lobby = document.getElementById('lobby');
const gameContainer = document.getElementById('game-container');
const nameInput = document.getElementById('nameInput'); // CAMBIO: Input de nombre
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const startBtn = document.getElementById('start-btn');
const roomInput = document.getElementById('roomInput');
const roomCodeDisplay = document.getElementById('room-code');
const playerList = document.getElementById('player-list');
const scoreList = document.getElementById('scoreList');

// Lienzo del juego
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
canvas.width = 600;
canvas.height = 600;

// Estado del cliente
let players = {};
let apple = {};
let currentRoomId = null;

// --- MANEJO DE EVENTOS DE BOTONES ---
createBtn.addEventListener('click', () => {
  const playerName = nameInput.value || 'Anónimo'; // CAMBIO: Obtiene el nombre
  socket.emit('createRoom', { playerName }); // CAMBIO: Envía el nombre al crear
});

joinBtn.addEventListener('click', () => {
  const roomId = roomInput.value;
  const playerName = nameInput.value || 'Anónimo'; // CAMBIO: Obtiene el nombre
  if (roomId) {
    socket.emit('joinRoom', { roomId, playerName }); // CAMBIO: Envía el nombre al unirse
  }
});

startBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('startGame', currentRoomId);
    }
});

// --- MANEJO DE EVENTOS DEL SERVIDOR ---
socket.on('roomCreated', (data) => {
  currentRoomId = data.roomId;
  players = data.players;
  showLobby(data.roomId, data.hostId);
});

socket.on('updatePlayers', (data) => {
  // Si te acabas de unir, establece tu ID de sala
  if (!currentRoomId) currentRoomId = roomInput.value;
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
    if (!gameState) return;
    players = gameState.players;
    apple = gameState.apple;
    draw();
});

socket.on('error', (message) => {
  alert(message);
});

// --- FUNCIONES DE UI ---
function showLobby(roomId, hostId) {
  mainMenu.classList.add('hidden');
  lobby.classList.remove('hidden');
  roomCodeDisplay.innerText = roomId;
  
  if (socket.id === hostId) {
      startBtn.classList.remove('hidden');
  }

  playerList.innerHTML = '';
  // CAMBIO: Muestra los nombres de los jugadores en el lobby
  for (const id in players) {
    const player = players[id];
    const li = document.createElement('li');
    li.style.color = player.color;
    li.textContent = `${player.name} ${id === hostId ? '👑' : ''}`;
    playerList.appendChild(li);
  }
}

function updateScoreboard() {
    scoreList.innerHTML = '';
    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
    
    // CAMBIO: Muestra "Nombre: Puntuación"
    sortedPlayers.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name}: ${player.score}`;
        li.style.color = player.color;
        scoreList.appendChild(li);
    });
}

// --- RENDERIZADO DEL JUEGO ---
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
  if(apple.x !== undefined){
      ctx.fillStyle = 'red';
      ctx.font = `${gridSize * 1.5}px Arial`;
      ctx.fillText('🍎', apple.x, apple.y + gridSize * 0.8);
  }
  updateScoreboard(); // Asegura que el marcador se actualice en cada frame
}

// --- CONTROLES ---
window.addEventListener('keydown', e => {
    let direction;
    switch (e.key) {
        case 'ArrowUp': case 'w': direction = 'up'; break;
        case 'ArrowDown': case 's': direction = 'down'; break;
        case 'ArrowLeft': case 'a': direction = 'left'; break;
        case 'ArrowRight': case 'd': direction = 'right'; break;
        default: return;
    }
    e.preventDefault();
    socket.emit('directionChange', { roomId: currentRoomId, direction });
});