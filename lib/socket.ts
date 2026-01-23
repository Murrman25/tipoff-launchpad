import { io, type Socket } from "socket.io-client";

// Reuse a single Socket.IO client across the app.
let socket: Socket | null = null;

export const getSocket = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "/";
    socket = io(url, {
      transports: ["websocket"],
      autoConnect: true
    });
  }

  return socket;
};
