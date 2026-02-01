import { io } from "socket.io-client";

// using wss:// instead of ws://
const SOCKET_URL = "https://socratic-eye-app.azurewebsites.net";

export const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],// adding polling as a fallback
    upgrade: true,            
    path: "/socket.io/",
    secure: true,             
    reconnection: true,
    reconnectionAttempts: 5,    
    reconnectionDelay: 1000,   
    reconnectionDelayMax: 5000, 
    timeout: 20000,            
    pingInterval: 25000,
    pingTimeout: 60000,
    forceNew: false,            
    autoConnect: true,          
});

socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
    console.error("Error details:", {
        type: error.type,
        description: error.description,
        context: error.context
    });
});

socket.on("connect", () => {
    console.log("Socket connected successfully");
    console.log("Socket ID:", socket.id);
    console.log("Transport:", socket.io.engine.transport.name);
});

export default socket;