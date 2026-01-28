import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

// 🔹 Force specific protocols to prevent Firefox "probing"
export const socket = io(SOCKET_URL, {
    transports: ['websocket'], //  NO polling; just pure websocket
    autoConnect: true,
    reconnection: true,        //  Aggressive reconnection
    reconnectionAttempts: 20,  
    reconnectionDelay: 1000,
    timeout: 60000,          
});