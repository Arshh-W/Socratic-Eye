import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // backend URL

export const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false
}
);
