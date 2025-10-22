import {io} from 'socket.io-client';
import {GameState} from './src/GameState.js';
import {MapManager} from './src/MapManager.js';
import {PathFinder} from './src/PathFinder.js';
import {EventHandler} from './src/EventHandler.js';
import { BotStrategy } from './src/BotStrategy.js'; // bạn sẽ tạo sau

import dotenv from 'dotenv';

dotenv.config();

const SOCKET_SERVER_ADDR = process.env.SOCKET_SERVER_ADDR;
const TOKEN = process.env.TOKEN;
const BOT_NAME = process.env.BOT_NAME;
const AUTO_START = process.env.AUTO_START === 'true';

const auth = {token: TOKEN};
const socket = io(SOCKET_SERVER_ADDR, {auth});

const gameState = new GameState();
let mapManager = null;
let pathFinder = null;
let currentPath = [];
let moveInterval = null;

const strategy = new BotStrategy(socket, gameState);
const eventHandler = new EventHandler(socket, gameState, strategy);
eventHandler.setupEventListeners();


socket.on('connect', () => {
    console.log('✅ Connected to server');
    socket.emit('join', {});
});

// socket.on('user', (data) => {
//     console.log('📥 Received game state');
//     gameState.updateFromServerData(data);
//
//     if (!mapManager) {
//         mapManager = new MapManager(data.map);
//         pathFinder = new PathFinder(mapManager);
//     }
//
//     const myBomber = gameState.myBomber;
//     if (!myBomber) {
//         console.warn('⚠️ My bomber not found yet');
//         return;
//     }
//
//     // Tìm vật phẩm gần nhất
//     const items = Array.from(gameState.items.values()).filter(i => !i.isCollected);
//     if (items.length === 0) {
//         console.log('🎯 No items to collect');
//         return;
//     }
//
//     const target = items[0]; // TODO: chọn vật phẩm gần nhất
//     currentPath = pathFinder.findPath(myBomber.x, myBomber.y, target.x, target.y);
//     console.log('🧭 Path to item:', currentPath);
//
//     // Bắt đầu di chuyển theo path
//     if (moveInterval) clearInterval(moveInterval);
//     let stepIndex = 0;
//     moveInterval = setInterval(() => {
//         if (stepIndex >= currentPath.length) {
//             clearInterval(moveInterval);
//             console.log('✅ Reached target');
//             return;
//         }
//
//         const next = currentPath[stepIndex];
//         const dx = next.x - myBomber.x;
//         const dy = next.y - myBomber.y;
//
//         let orient = null;
//         if (Math.abs(dx) > Math.abs(dy)) {
//             orient = dx > 0 ? 'RIGHT' : 'LEFT';
//         } else {
//             orient = dy > 0 ? 'DOWN' : 'UP';
//         }
//
//         socket.emit('move', {orient});
//         stepIndex++;
//     }, 17); // 100ms mỗi bước, có thể giảm xuống 17ms nếu cần
// });
