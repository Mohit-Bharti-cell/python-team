import { io } from "socket.io-client";

const socket = io("https://exam-backend-11.onrender.com", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("✅ Connected to backend with socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

export function emitViolation(params) {
  socket.emit("suspicious_event", {
    ...params,
    timestamp: new Date().toISOString(),
  });
}

export default socket;