import { io } from "socket.io-client";

// Ensure this matches your Azure Web App URL exactly
const SOCKET_URL = "https://socratic-eye-app.azurewebsites.net";

export const socket = io("https://socratic-eye-app.azurewebsites.net", {
    transports: ['websocket'], //  Skip polling for Azure compatibility
    upgrade: false,            //  Prevent upgrade attempts
    path: "/socket.io/",       //  Explicitly define the path
    secure: true,              //  Force WSS
    reconnection: true
});