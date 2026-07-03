import PartySocket from "partysocket";

let socket: PartySocket | null = null;
let currentRoom: string | null = null;

export const connectSocket = (roomId: string) => {
  if (socket && currentRoom === roomId) return socket;
  if (socket) { socket.close(); socket = null; }
  currentRoom = roomId;
  socket = new PartySocket({
    host: import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999",
    room: roomId,
    party: "chat",
  });
  socket.addEventListener("error", (evt) => {
    console.error("[PartySocket] error:", evt);
    window.dispatchEvent(new CustomEvent("socket_offline", {
      detail: { message: "Real-time connection lost. Please refresh." }
    }));
  });
  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) { socket.close(); socket = null; currentRoom = null; }
};
